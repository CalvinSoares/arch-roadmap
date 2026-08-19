import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { xpEvents, userStats } from "@/server/db/schema";
import { acumularXpTemporada } from "@/server/gamificacao/temporada";
import { nivelPara } from "@/shared/lib/gamificacao/xp";
import {
  registrarAtividade,
  type EstadoStreak,
  type ResultadoStreak,
} from "@/shared/lib/gamificacao/streak";

/**
 * Concessão de XP no servidor. O cliente reporta a ação ("acertei a pergunta
 * X") e o servidor decide quanto XP pagar.
 *
 *  - Ledger append-only (`xp_events`): evento nunca recebe UPDATE.
 *  - Idempotência: `origem_ref` tem índice único, então duplo clique, retry e
 *    reprocessamento com a mesma chave não inserem nada.
 *  - `user_stats` (xp/nível/streak) é projeção derivada do ledger; se
 *    corromper, reprocessa.
 *
 * O driver HTTP da Neon não faz transação interativa; por isso as escritas são
 * sequenciais e a projeção é reconstruível de propósito (não depende de
 * atomicidade).
 */

export interface ConcederXpEntrada {
  userId: string;
  /** `AcaoXP` ("quizAcerto"…) ou origem sintética ("missao:acerte-5"). */
  tipo: string;
  quantia: number;
  /** Chave determinística de idempotência. Ex.: "quiz:<tentativaId>". */
  origemRef: string;
}

export interface ConcederXpResultado {
  /** `false` quando a chave já existia e nada foi pago (idempotência). */
  concedido: boolean;
  /** XP efetivamente creditado neste evento (0 se duplicado). */
  xp: number;
}

/**
 * Credita XP no ledger de forma idempotente. `onConflictDoNothing` +
 * `returning`: se nada volta, a `origemRef` já existia e não paga de novo.
 * Não reprojecta sozinho; quem orquestra chama `reprojetarXp` depois.
 */
export async function concederXp(
  e: ConcederXpEntrada
): Promise<ConcederXpResultado> {
  if (e.quantia <= 0) return { concedido: false, xp: 0 };

  const inseridos = await db
    .insert(xpEvents)
    .values({
      userId: e.userId,
      tipo: e.tipo,
      quantia: e.quantia,
      origemRef: e.origemRef,
    })
    .onConflictDoNothing({
      target: [xpEvents.userId, xpEvents.origemRef],
    })
    .returning({ id: xpEvents.id });

  const concedido = inseridos.length > 0;
  // O XP concedido também alimenta o placar da temporada (corrida semanal).
  if (concedido) await acumularXpTemporada(e.userId, e.quantia);
  return { concedido, xp: concedido ? e.quantia : 0 };
}

/**
 * Recalcula a projeção de XP/nível somando o ledger inteiro do usuário.
 * O nível é derivado do total, nunca gravado à mão. Rodar N vezes dá o mesmo
 * resultado.
 */
export async function reprojetarXp(userId: string): Promise<{
  xpTotal: number;
  nivel: number;
  /** Nível antes desta reprojeção, pra detectar "subiu de nível". */
  nivelAnterior: number;
}> {
  const [antes] = await db
    .select({ nivel: userStats.nivel })
    .from(userStats)
    .where(eq(userStats.userId, userId));
  const nivelAnterior = antes?.nivel ?? 1;

  const [linha] = await db
    .select({
      total: sql<number>`coalesce(sum(${xpEvents.quantia}), 0)`,
    })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId));

  const xpTotal = Number(linha?.total ?? 0);
  const nivel = nivelPara(xpTotal);

  await db
    .insert(userStats)
    .values({ userId, xpTotal, nivel })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: { xpTotal, nivel, atualizadoEm: sql`now()` },
    });

  return { xpTotal, nivel, nivelAnterior };
}

/**
 * Registra que o usuário esteve ativo em `hoje` (ISO YYYY-MM-DD) e atualiza o
 * streak na projeção. A regra de subir/usar freeze/quebrar fica na função pura
 * `registrarAtividade`; aqui é só o I/O em volta. Idempotente no mesmo dia
 * (a função pura não mexe em nada se `hoje` já é o último dia ativo).
 */
export async function registrarDiaAtivo(
  userId: string,
  hoje: string
): Promise<ResultadoStreak> {
  const [s] = await db
    .select({
      streakDias: userStats.streakDias,
      ultimoDiaAtivo: userStats.ultimoDiaAtivo,
      freezes: userStats.freezes,
      maiorStreak: userStats.maiorStreak,
    })
    .from(userStats)
    .where(eq(userStats.userId, userId));

  const estado: EstadoStreak = {
    dias: s?.streakDias ?? 0,
    ultimoDia: s?.ultimoDiaAtivo ?? null,
    freezes: s?.freezes ?? 0,
    maior: s?.maiorStreak ?? 0,
  };

  const r = registrarAtividade(estado, hoje);

  await db
    .insert(userStats)
    .values({
      userId,
      streakDias: r.estado.dias,
      maiorStreak: r.estado.maior,
      ultimoDiaAtivo: r.estado.ultimoDia,
      freezes: r.estado.freezes,
    })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: {
        streakDias: r.estado.dias,
        maiorStreak: r.estado.maior,
        ultimoDiaAtivo: r.estado.ultimoDia,
        freezes: r.estado.freezes,
        atualizadoEm: sql`now()`,
      },
    });

  return r;
}

/**
 * "Hoje" do usuário em ISO YYYY-MM-DD, respeitando o fuso. Sem isso, quem está
 * em -03 viraria o dia às 21h e o streak quebraria errado.
 */
export function hojeDoUsuario(timezone?: string | null): string {
  const agora = new Date();
  if (timezone) {
    try {
      // en-CA formata como YYYY-MM-DD.
      return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
        agora
      );
    } catch {
      // fuso inválido, cai pra UTC
    }
  }
  return agora.toISOString().slice(0, 10);
}
