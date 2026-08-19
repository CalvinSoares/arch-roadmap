"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { getUsuario } from "@/server/auth/dal";
import { db } from "@/server/db";
import {
  users,
  userStats,
  xpEvents,
  missaoProgresso,
} from "@/server/db/schema";
import { progressoNivel } from "@/shared/lib/gamificacao/xp";
import { missoesDoDia } from "@/shared/lib/gamificacao/missoes";
import { hojeDoUsuario } from "@/server/gamificacao/conceder-xp";

export interface StatusResumido {
  nivel: number;
  xpTotal: number;
  streakDias: number;
  /** 0 a 1: progresso dentro do nível atual (anel/barra do header). */
  pct: number;
}

/**
 * Status enxuto pro indicador do header, uma única leitura da projeção.
 * Leve de propósito: roda em toda página quando logado. `null` sem sessão (o
 * indicador não aparece).
 */
export async function meuStatus(): Promise<StatusResumido | null> {
  const u = await getUsuario();
  if (!u) return null;

  const [s] = await db
    .select({
      xpTotal: userStats.xpTotal,
      nivel: userStats.nivel,
      streakDias: userStats.streakDias,
    })
    .from(userStats)
    .where(eq(userStats.userId, u.id));

  const xpTotal = s?.xpTotal ?? 0;
  return {
    nivel: s?.nivel ?? 1,
    xpTotal,
    streakDias: s?.streakDias ?? 0,
    pct: progressoNivel(xpTotal).pct,
  };
}

/** Meta diária de XP.
 *  Não exportado: num arquivo "use server" só funções async podem ser exports. */
const META_DIARIA_XP = 50;

export interface MetaDoDia {
  xpHoje: number;
  meta: number;
  atingiu: boolean;
}

/**
 * XP ganho hoje (no fuso do usuário) para o anel de meta diária. Soma o ledger
 * a partir da meia-noite local. `null` sem sessão (o anel não aparece).
 */
export async function metaDoDia(): Promise<MetaDoDia | null> {
  const u = await getUsuario();
  if (!u) return null;

  const [uu] = await db
    .select({ tz: users.timezone })
    .from(users)
    .where(eq(users.id, u.id));
  const hoje = hojeDoUsuario(uu?.tz ?? null); // ISO YYYY-MM-DD

  const [linha] = await db
    .select({ total: sql<number>`coalesce(sum(${xpEvents.quantia}), 0)` })
    .from(xpEvents)
    .where(
      and(
        eq(xpEvents.userId, u.id),
        gte(xpEvents.criadoEm, sql`${hoje}::date`)
      )
    );

  const xpHoje = Number(linha?.total ?? 0);
  return { xpHoje, meta: META_DIARIA_XP, atingiu: xpHoje >= META_DIARIA_XP };
}

export interface MissaoHoje {
  id: string;
  titulo: string;
  descricao: string;
  meta: number;
  xpRecompensa: number;
  progresso: number;
  concluida: boolean;
}

/**
 * Missões de hoje com o progresso do usuário: leitura enxuta pro rail da
 * jornada (uma query, sem o peso do resumo completo do perfil). `null` sem
 * sessão (o rail mostra o convite de conta no lugar).
 */
export async function missoesDeHoje(): Promise<MissaoHoje[] | null> {
  const u = await getUsuario();
  if (!u) return null;

  const [uu] = await db
    .select({ tz: users.timezone })
    .from(users)
    .where(eq(users.id, u.id));
  const hoje = hojeDoUsuario(uu?.tz ?? null);

  const linhas = await db
    .select({
      missaoId: missaoProgresso.missaoId,
      progresso: missaoProgresso.progresso,
      concluida: missaoProgresso.concluida,
    })
    .from(missaoProgresso)
    .where(
      and(eq(missaoProgresso.userId, u.id), eq(missaoProgresso.dia, hoje))
    );
  const porId = new Map(linhas.map((l) => [l.missaoId, l]));

  return missoesDoDia(hoje).map((m) => ({
    id: m.id,
    titulo: m.titulo,
    descricao: m.descricao,
    meta: m.meta,
    xpRecompensa: m.xpRecompensa,
    progresso: porId.get(m.id)?.progresso ?? 0,
    concluida: porId.get(m.id)?.concluida ?? false,
  }));
}
