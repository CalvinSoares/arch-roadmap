"use server";

import { eq, sql } from "drizzle-orm";
import { getUsuario } from "@/server/auth/dal";
import { db } from "@/server/db";
import { progresso } from "@/server/db/schema";
import { limitadores, limitar } from "@/server/rate-limit";
import { mesclarProgresso } from "@/shared/lib/progresso";
import type { ProgressoNo } from "@/shared/types/roadmap";

/** Teto defensivo — o payload vem do cliente (não confiável). */
const MAX_ENTRADAS = 2000;

export interface ResultadoMigracao {
  /** Quantos nós foram gravados/promovidos na conta. */
  migrado: number;
  erro?: string;
}

/**
 * Migração local→conta: mescla o progresso do `localStorage` (enviado pelo
 * cliente) na conta logada. Server action — a fronteira confiável.
 *
 * O merge é servidor-autoritativo e idempotente por natureza: roda `mesclarProgresso`
 * (função pura, o estado mais avançado vence) e faz upsert só do que muda. Chamar
 * duas vezes com o mesmo local é inofensivo — a segunda não acha nada para gravar.
 */
export async function migrarProgressoLocal(
  entradas: { noId: unknown; status: unknown }[]
): Promise<ResultadoMigracao> {
  const u = await getUsuario();
  if (!u) return { migrado: 0, erro: "Sem sessão." };
  if (!Array.isArray(entradas) || entradas.length === 0) return { migrado: 0 };

  // Rate limit por usuário — a migração é uma escrita como outra qualquer.
  const lim = await limitar(limitadores.escrita, `migrar:${u.id}`);
  if (!lim.sucesso) return { migrado: 0, erro: "Muitas tentativas." };

  // Estado atual da conta, para o merge decidir o que realmente muda.
  const existentes = await db
    .select({ noId: progresso.noId, status: progresso.status })
    .from(progresso)
    .where(eq(progresso.userId, u.id));

  const servidor: Record<string, ProgressoNo> = {};
  for (const r of existentes) servidor[r.noId] = r.status as ProgressoNo;

  const escrever = mesclarProgresso(entradas.slice(0, MAX_ENTRADAS), servidor);
  if (escrever.length === 0) return { migrado: 0 };

  await db
    .insert(progresso)
    .values(
      escrever.map((e) => ({ userId: u.id, noId: e.noId, status: e.status }))
    )
    .onConflictDoUpdate({
      target: [progresso.userId, progresso.noId],
      set: { status: sql`excluded.status`, atualizadoEm: sql`now()` },
    });

  return { migrado: escrever.length };
}
