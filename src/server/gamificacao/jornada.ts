"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { getUsuario } from "@/server/auth/dal";
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

/**
 * Estado da jornada no servidor — só as estrelas (a conclusão do nó já é gravada
 * por `definirProgresso`). Sincroniza o brilho entre dispositivos; o localStorage
 * segue como camada anônima/instantânea.
 */

/**
 * Grava as estrelas de um nó, mantendo o **melhor** resultado (um replay pior
 * não rebaixa). Idempotente por (usuário, nó).
 */
export async function registrarEstrelasNo(
  noId: string,
  estrelas: number
): Promise<{ ok: boolean }> {
  const u = await getUsuario();
  if (!u) return { ok: false };

  const id = String(noId ?? "").trim();
  const e = Math.max(0, Math.min(3, Math.round(Number(estrelas) || 0)));
  if (!id) return { ok: false };

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

/** Recompensa do baú. Local (não exportado): "use server" só exporta async. */
const XP_BAU = 25;

export interface ResultadoBau {
  ok: boolean;
  /** XP creditado nesta abertura (0 se já estava aberto). */
  xp?: number;
  /** Freezes ganhos nesta abertura. */
  freezes?: number;
  /** O baú já tinha sido aberto antes (idempotência). */
  jaAberto?: boolean;
  erro?: string;
}

/**
 * Abre o baú de uma unidade — **servidor-autoritativo e idempotente**.
 *
 * O cliente só aponta qual baú; o servidor confere no `progresso` da conta se o
 * nó do meio da unidade está concluído (a regra de alcance do baú) e concede a
 * recompensa **uma única vez** via ledger (`origem_ref = "bau:<slug>:<seção>"`).
 * O +1 freeze pega carona na idempotência do evento: só incrementa quando o
 * INSERT do ledger de fato aconteceu — reabrir nunca paga de novo.
 */
export async function abrirBau(
  roadmapSlug: string,
  secaoId: string
): Promise<ResultadoBau> {
  const u = await getUsuario();
  if (!u) return { ok: false, erro: "sem sessão" };

  const lim = await limitar(limitadores.escrita, `bau:${u.id}`);
  if (!lim.sucesso) return { ok: false, erro: "muitas tentativas" };

  const roadmap = getRoadmap(String(roadmapSlug ?? "").trim());
  const secao = roadmap?.sections.find((s) => s.id === secaoId);
  // baú só existe em unidade com corpo (mesma regra da UI)
  if (!roadmap || !secao || secao.items.length < 4) {
    return { ok: false, erro: "baú inexistente" };
  }

  // Validação de alcance na CONTA (não confiamos no cliente).
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

/**
 * Quais destas referências de baú o usuário já abriu — leitura direta do
 * ledger (a fonte da verdade da idempotência). Alimenta o estado "aberto" dos
 * baús no path.
 */
export async function bausAbertos(refs: string[]): Promise<string[]> {
  const u = await getUsuario();
  if (!u || !Array.isArray(refs) || refs.length === 0) return [];
  const linhas = await db
    .select({ ref: xpEvents.origemRef })
    .from(xpEvents)
    .where(and(eq(xpEvents.userId, u.id), inArray(xpEvents.origemRef, refs)));
  return linhas.map((l) => l.ref);
}

/** Estrelas do usuário para um conjunto de nós (mapa noId → estrelas). */
export async function estrelasDoUsuario(
  userId: string,
  noIds: readonly string[]
): Promise<Record<string, number>> {
  if (noIds.length === 0) return {};
  const linhas = await db
    .select({ noId: jornadaEstado.noId, estrelas: jornadaEstado.estrelas })
    .from(jornadaEstado)
    .where(
      and(
        eq(jornadaEstado.userId, userId),
        inArray(jornadaEstado.noId, [...noIds])
      )
    );
  const mapa: Record<string, number> = {};
  for (const l of linhas) mapa[l.noId] = l.estrelas;
  return mapa;
}
