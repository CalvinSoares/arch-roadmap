"use server";

import { eq, sql } from "drizzle-orm";
import { getUsuario } from "@/server/auth/dal";
import { db } from "@/server/db";
import { progresso } from "@/server/db/schema";
import { limitadores, limitar } from "@/server/rate-limit";
import { mesclarProgresso } from "@/shared/lib/progresso";
import type { ProgressoNo } from "@/shared/types/roadmap";

/** Teto defensivo: o payload vem do cliente, não dá pra confiar no tamanho. */
const MAX_ENTRADAS = 2000;

export interface ResultadoMigracao {
  /** Quantos nós foram gravados/promovidos na conta. */
  migrado: number;
  /**
   * Estado completo da conta após o merge (`noId → status`). O cliente semeia
   * o `localStorage` com isto, então o dispositivo passa a refletir a conta
   * inteira, não só o que foi tocado localmente.
   */
  estado: Record<string, ProgressoNo>;
  erro?: string;
}

/**
 * Sincronização local↔conta: mescla o progresso do `localStorage` (enviado
 * pelo cliente) na conta logada e devolve o estado consolidado. Server action;
 * a validação toda acontece aqui, o cliente não decide nada.
 *
 * Push e pull na mesma chamada: roda `mesclarProgresso` (função pura, vence o
 * estado mais avançado) e faz upsert do que mudou, depois devolve o mapa
 * completo da conta pro cliente semear. Idempotente: com o mesmo local, a
 * segunda chamada não grava nada. Com `entradas` vazio (dispositivo novo),
 * só puxa.
 */
export async function migrarProgressoLocal(
  entradas: { noId: unknown; status: unknown }[]
): Promise<ResultadoMigracao> {
  const u = await getUsuario();
  if (!u) return { migrado: 0, estado: {}, erro: "Sem sessão." };

  const lista = Array.isArray(entradas) ? entradas : [];

  // Rate limit por usuário: sincronização conta como escrita.
  const lim = await limitar(limitadores.escrita, `migrar:${u.id}`);
  if (!lim.sucesso) return { migrado: 0, estado: {}, erro: "Muitas tentativas." };

  // Estado atual da conta, base do merge e do estado devolvido.
  const existentes = await db
    .select({ noId: progresso.noId, status: progresso.status })
    .from(progresso)
    .where(eq(progresso.userId, u.id));

  const servidor: Record<string, ProgressoNo> = {};
  for (const r of existentes) servidor[r.noId] = r.status as ProgressoNo;

  const escrever = mesclarProgresso(lista.slice(0, MAX_ENTRADAS), servidor);

  if (escrever.length > 0) {
    await db
      .insert(progresso)
      .values(
        escrever.map((e) => ({ userId: u.id, noId: e.noId, status: e.status }))
      )
      .onConflictDoUpdate({
        target: [progresso.userId, progresso.noId],
        set: { status: sql`excluded.status`, atualizadoEm: sql`now()` },
      });
    // aplica o merge ao estado devolvido, sem reconsultar o banco
    for (const e of escrever) servidor[e.noId] = e.status;
  }

  return { migrado: escrever.length, estado: servidor };
}
