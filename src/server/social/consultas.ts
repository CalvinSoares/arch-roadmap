import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { users, userStats, amizades } from "@/server/db/schema";

/**
 * Consultas sociais (read-only). O ranking entre amigos compara o XP vitalício
 * de você + seus amigos aceitos; não existe ranking global.
 */

export interface LinhaRanking {
  userId: string;
  handle: string | null;
  nome: string | null;
  xpTotal: number;
  nivel: number;
  streakDias: number;
  /** É a linha do próprio usuário (destaca na UI). */
  ehVoce: boolean;
}

export async function rankingAmigos(userId: string): Promise<LinhaRanking[]> {
  const amigos = await db
    .select({ amigoId: amizades.amigoId })
    .from(amizades)
    .where(and(eq(amizades.userId, userId), eq(amizades.status, "accepted")));

  const ids = Array.from(new Set([userId, ...amigos.map((a) => a.amigoId)]));

  const linhas = await db
    .select({
      userId: users.id,
      handle: users.handle,
      nome: users.name,
      banido: users.banido,
      shadowBan: users.shadowBan,
      xpTotal: userStats.xpTotal,
      nivel: userStats.nivel,
      streakDias: userStats.streakDias,
    })
    .from(users)
    .leftJoin(userStats, eq(userStats.userId, users.id))
    .where(inArray(users.id, ids));

  return linhas
    // banido/shadow somem do ranking, mas você sempre se vê
    .filter((l) => l.userId === userId || (!l.banido && !l.shadowBan))
    .map((l) => ({
      userId: l.userId,
      handle: l.handle,
      nome: l.nome,
      xpTotal: l.xpTotal ?? 0,
      nivel: l.nivel ?? 1,
      streakDias: l.streakDias ?? 0,
      ehVoce: l.userId === userId,
    }))
    .sort((a, b) => b.xpTotal - a.xpTotal || a.userId.localeCompare(b.userId));
}

export interface ConvitePendente {
  origemId: string;
  handle: string | null;
  nome: string | null;
}

export async function convitesPendentes(
  userId: string
): Promise<ConvitePendente[]> {
  return db
    .select({
      origemId: amizades.userId,
      handle: users.handle,
      nome: users.name,
    })
    .from(amizades)
    .innerJoin(users, eq(users.id, amizades.userId))
    .where(and(eq(amizades.amigoId, userId), eq(amizades.status, "pending")));
}
