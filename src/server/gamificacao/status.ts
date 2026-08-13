"use server";

import { eq } from "drizzle-orm";
import { getUsuario } from "@/server/auth/dal";
import { db } from "@/server/db";
import { userStats } from "@/server/db/schema";
import { progressoNivel } from "@/shared/lib/gamificacao/xp";

export interface StatusResumido {
  nivel: number;
  xpTotal: number;
  streakDias: number;
  /** 0 a 1 — progresso dentro do nível atual (para o anel/barra do header). */
  pct: number;
}

/**
 * Status enxuto para o indicador do header — uma única leitura da projeção.
 * Leve de propósito: roda em toda página quando logado. `null` sem sessão (o
 * indicador simplesmente não aparece).
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
