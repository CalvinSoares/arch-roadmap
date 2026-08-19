import { and, eq, count } from "drizzle-orm";
import { db } from "@/server/db";
import {
  userStats,
  quizTentativas,
  progresso,
  userConquistas,
} from "@/server/db/schema";
import {
  conquistasGanhas,
  type MetricasConquista,
} from "@/shared/lib/gamificacao/conquistas";

/**
 * Concessão de conquistas: o I/O em volta da lógica pura de `conquistas.ts`.
 *
 * Reúne as métricas do usuário, pergunta à função pura quais badges ele merece
 * e insere os que faltam. A PK composta `(userId, chave)` +
 * `onConflictDoNothing` deixa a concessão idempotente: rodar a avaliação a
 * cada award não gera duplicata.
 */
export async function avaliarConquistas(userId: string): Promise<string[]> {
  const [stats] = await db
    .select({
      xpTotal: userStats.xpTotal,
      maiorStreak: userStats.maiorStreak,
    })
    .from(userStats)
    .where(eq(userStats.userId, userId));

  const [acertos] = await db
    .select({ n: count() })
    .from(quizTentativas)
    .where(
      and(eq(quizTentativas.userId, userId), eq(quizTentativas.acertou, true))
    );

  const [nos] = await db
    .select({ n: count() })
    .from(progresso)
    .where(and(eq(progresso.userId, userId), eq(progresso.status, "done")));

  const metricas: MetricasConquista = {
    xpTotal: stats?.xpTotal ?? 0,
    maiorStreak: stats?.maiorStreak ?? 0,
    quizAcertos: Number(acertos?.n ?? 0),
    nosConcluidos: Number(nos?.n ?? 0),
  };

  const merecidas = conquistasGanhas(metricas);
  if (merecidas.length === 0) return [];

  await db
    .insert(userConquistas)
    .values(merecidas.map((chave) => ({ userId, conquistaChave: chave })))
    .onConflictDoNothing({
      target: [userConquistas.userId, userConquistas.conquistaChave],
    });

  return merecidas;
}
