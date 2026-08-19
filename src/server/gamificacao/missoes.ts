import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { missaoProgresso } from "@/server/db/schema";
import {
  missoesDoDia,
  avancarMissao,
  type GatilhoMissao,
} from "@/shared/lib/gamificacao/missoes";
import { concederXp } from "@/server/gamificacao/conceder-xp";

/**
 * Avança o progresso das missões do dia por um gatilho. Helper interno (não é
 * server action): quem chama são as ações de quiz/nó, que já validaram sessão e
 * rate limit.
 *
 * A recompensa é concedida via ledger idempotente com
 * `origem_ref = "missao:<id>:<dia>"`, então uma missão paga uma vez por dia,
 * mesmo que o reprocessamento rode de novo. Não reprojecta: o orquestrador
 * reprojecta uma única vez ao fim.
 *
 * @returns `true` se alguma recompensa foi concedida (o caller deve reprojetar).
 */
export async function avancarMissoesDoDia(
  userId: string,
  dia: string,
  gatilho: GatilhoMissao,
  quantidade = 1
): Promise<boolean> {
  const relevantes = missoesDoDia(dia).filter((m) => m.gatilho === gatilho);
  if (relevantes.length === 0) return false;

  const existentes = await db
    .select({
      missaoId: missaoProgresso.missaoId,
      progresso: missaoProgresso.progresso,
      concluida: missaoProgresso.concluida,
    })
    .from(missaoProgresso)
    .where(
      and(eq(missaoProgresso.userId, userId), eq(missaoProgresso.dia, dia))
    );
  const porId = new Map(existentes.map((r) => [r.missaoId, r]));

  let concedeuAlgo = false;

  for (const missao of relevantes) {
    const atual = porId.get(missao.id);
    const estado = {
      progresso: atual?.progresso ?? 0,
      concluida: atual?.concluida ?? false,
    };
    const r = avancarMissao(missao, estado, gatilho, quantidade);
    if (r.estado === estado) continue; // já concluída ou sem mudança

    await db
      .insert(missaoProgresso)
      .values({
        userId,
        missaoId: missao.id,
        dia,
        progresso: r.estado.progresso,
        concluida: r.estado.concluida,
      })
      .onConflictDoUpdate({
        target: [
          missaoProgresso.userId,
          missaoProgresso.missaoId,
          missaoProgresso.dia,
        ],
        set: {
          progresso: r.estado.progresso,
          concluida: r.estado.concluida,
          atualizadoEm: sql`now()`,
        },
      });

    if (r.recemConcluida) {
      const { concedido } = await concederXp({
        userId,
        tipo: `missao:${missao.id}`,
        quantia: missao.xpRecompensa,
        origemRef: `missao:${missao.id}:${dia}`,
      });
      concedeuAlgo = concedeuAlgo || concedido;
    }
  }

  return concedeuAlgo;
}
