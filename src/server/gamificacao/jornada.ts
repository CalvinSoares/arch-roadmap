"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { getUsuario, requireUsuarioAtivo } from "@/server/auth/dal";
import { db } from "@/server/db";
import {
  jornadaEstado,
  progresso,
  userStats,
  xpEvents,
} from "@/server/db/schema";
import { getRoadmap } from "@/shared/lib/content";
import { limitadores, limitar } from "@/server/rate-limit";
import {
  concederXp,
  reprojetarXp,
} from "@/server/gamificacao/conceder-xp";
import { noExisteEmAlgumRoadmap } from "@/server/gamificacao/validacao";

/**
 * Estado da jornada no servidor: só as estrelas (a conclusão do nó já é gravada
 * por `definirProgresso`). Sincroniza entre dispositivos; o localStorage segue
 * cobrindo o uso anônimo.
 */

/**
 * Grava as estrelas de um nó, mantendo o melhor resultado (replay pior não
 * rebaixa). Idempotente por (usuário, nó).
 */
export async function registrarEstrelasNo(
  noId: string,
  estrelas: number
): Promise<{ ok: boolean }> {
  const u = await requireUsuarioAtivo();
  if (!u) return { ok: false };

  const lim = await limitar(limitadores.escrita, `estrelas:${u.id}`, "escrita");
  if (!lim.sucesso) return { ok: false };

  const id = String(noId ?? "").trim();
  const e = Math.max(0, Math.min(3, Math.round(Number(estrelas) || 0)));
  if (!id || !noExisteEmAlgumRoadmap(id)) return { ok: false };

  await db
    .insert(jornadaEstado)
    .values({ userId: u.id, noId: id, estrelas: e })
    .onConflictDoUpdate({
      target: [jornadaEstado.userId, jornadaEstado.noId],
      set: {
        estrelas: sql`greatest(${jornadaEstado.estrelas}, excluded.estrelas)`,
        concluidoEm: sql`now()`,
      },
    });

  return { ok: true };
}

const XP_BAU = 25;

export interface ResultadoBau {
  ok: boolean;
  xp?: number;
  freezes?: number;
  jaAberto?: boolean;
  erro?: string;
}

/**
 * Abre o baú de uma unidade. O servidor valida e concede; idempotente.
 */
export async function abrirBau(
  roadmapSlug: string,
  secaoId: string
): Promise<ResultadoBau> {
  const u = await requireUsuarioAtivo();
  if (!u) return { ok: false, erro: "sem sessão" };

  const lim = await limitar(limitadores.escrita, `bau:${u.id}`, "escrita");
  if (!lim.sucesso) return { ok: false, erro: "muitas tentativas" };

  const roadmap = getRoadmap(String(roadmapSlug ?? "").trim());
  const secao = roadmap?.sections.find((s) => s.id === secaoId);
  if (!roadmap || !secao || secao.items.length < 4) {
    return { ok: false, erro: "baú inexistente" };
  }

  const meio = secao.items[Math.floor(secao.items.length / 2)];
  const [linha] = await db
    .select({ status: progresso.status })
    .from(progresso)
    .where(and(eq(progresso.userId, u.id), eq(progresso.noId, meio.id)));
  if (linha?.status !== "done") {
    return { ok: false, erro: "ainda não alcançado" };
  }

  const r = await concederXp({
    userId: u.id,
    tipo: "bau",
    quantia: XP_BAU,
    origemRef: `bau:${roadmap.slug}:${secao.id}`,
  });
  if (!r.concedido) return { ok: true, jaAberto: true, xp: 0 };

  await db
    .insert(userStats)
    .values({ userId: u.id, freezes: 1 })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: {
        freezes: sql`${userStats.freezes} + 1`,
        atualizadoEm: sql`now()`,
      },
    });
  await reprojetarXp(u.id);

  return { ok: true, xp: r.xp, freezes: 1 };
}

export async function bausAbertos(refs: string[]): Promise<string[]> {
  const u = await getUsuario();
  if (!u || !Array.isArray(refs) || refs.length === 0) return [];
  const limpas = refs
    .map((r) => String(r ?? "").trim())
    .filter((r) => r.startsWith("bau:") && r.length < 200)
    .slice(0, 64);
  if (limpas.length === 0) return [];
  const linhas = await db
    .select({ ref: xpEvents.origemRef })
    .from(xpEvents)
    .where(and(eq(xpEvents.userId, u.id), inArray(xpEvents.origemRef, limpas)));
  return linhas.map((l) => l.ref);
}

/**
 * Estrelas do usuário da sessão para um conjunto de nós.
 * Ignora qualquer userId externo (fecha IDOR).
 */
export async function estrelasDoUsuario(
  noIds: readonly string[]
): Promise<Record<string, number>> {
  const u = await getUsuario();
  if (!u || !Array.isArray(noIds) || noIds.length === 0) return {};

  const ids = [...new Set(noIds.map((id) => String(id ?? "").trim()))]
    .filter((id) => id.length > 0 && id.length < 120)
    .slice(0, 200);
  if (ids.length === 0) return {};

  const linhas = await db
    .select({ noId: jornadaEstado.noId, estrelas: jornadaEstado.estrelas })
    .from(jornadaEstado)
    .where(
      and(eq(jornadaEstado.userId, u.id), inArray(jornadaEstado.noId, ids))
    );
  const mapa: Record<string, number> = {};
  for (const l of linhas) mapa[l.noId] = l.estrelas;
  return mapa;
}
