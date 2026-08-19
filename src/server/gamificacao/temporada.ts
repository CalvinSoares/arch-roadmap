import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { temporadas, ligaMembros, users } from "@/server/db/schema";
import {
  classificarTier,
  NIVEIS_LIGA,
  type NivelLiga,
} from "@/shared/lib/gamificacao/ligas";

/**
 * Temporadas e ligas: o I/O em volta da lógica pura de `ligas.ts`.
 *
 * O XP da temporada (`liga_membros.xp_na_temporada`) é separado do XP vitalício
 * (`user_stats.xp_total`); a corrida reinicia toda semana. A virada (cron)
 * fecha a temporada ativa, aplica promoção/rebaixamento por tier e abre a
 * próxima.
 */

/** A temporada ativa, ou `null` se ainda não há nenhuma. */
export async function temporadaAtiva() {
  const [t] = await db
    .select()
    .from(temporadas)
    .where(eq(temporadas.ativa, true))
    .orderBy(desc(temporadas.inicio))
    .limit(1);
  return t ?? null;
}

/**
 * A temporada ativa, criando uma se não existir. A criação preguiçosa cobre o
 * bootstrap; o cron é o dono real do ciclo. (Uma corrida rara pode criar duas
 * ativas no primeiro XP da vida do sistema; o cron normaliza na virada.)
 */
export async function garantirTemporada() {
  const atual = await temporadaAtiva();
  if (atual) return atual;
  const [nova] = await db.insert(temporadas).values({}).returning();
  return nova;
}

/**
 * Acumula XP da temporada para o usuário na temporada ativa. Chamado a cada
 * concessão de XP efetivada. Incremento atômico no banco (sql `x + n`), então
 * dois awards simultâneos somam sem race.
 */
export async function acumularXpTemporada(
  userId: string,
  quantia: number
): Promise<void> {
  if (quantia <= 0) return;
  const temp = await garantirTemporada();
  await db
    .insert(ligaMembros)
    .values({ temporadaId: temp.id, userId, xpNaTemporada: quantia })
    .onConflictDoUpdate({
      target: [ligaMembros.temporadaId, ligaMembros.userId],
      set: {
        xpNaTemporada: sql`${ligaMembros.xpNaTemporada} + ${quantia}`,
      },
    });
}

export interface ResultadoVirada {
  temporadaEncerrada: string | null;
  temporadaNova: string;
  membrosCarregados: number;
}

/**
 * Vira a temporada: encerra a ativa, classifica cada tier (top sobem, base
 * descem, inativos caem) e semeia a próxima com os mesmos membros no novo tier
 * e XP zerado. Idempotente o suficiente: se não houver temporada ativa, só cria
 * uma nova vazia.
 */
export async function virarTemporada(): Promise<ResultadoVirada> {
  const atual = await temporadaAtiva();

  if (!atual) {
    const nova = await garantirTemporada();
    return {
      temporadaEncerrada: null,
      temporadaNova: nova.id,
      membrosCarregados: 0,
    };
  }

  const membros = await db
    .select({
      userId: ligaMembros.userId,
      nivel: ligaMembros.nivel,
      xpNaTemporada: ligaMembros.xpNaTemporada,
    })
    .from(ligaMembros)
    .where(eq(ligaMembros.temporadaId, atual.id));

  // Classifica por tier (a lógica pura decide para onde cada um vai).
  const proximoNivel = new Map<string, NivelLiga>();
  for (const nivel of NIVEIS_LIGA) {
    const doTier = membros
      .filter((m) => m.nivel === nivel)
      .sort(
        (a, b) =>
          b.xpNaTemporada - a.xpNaTemporada || a.userId.localeCompare(b.userId)
      );
    for (const t of classificarTier(doTier, nivel)) {
      proximoNivel.set(t.userId, t.para);
    }
  }

  // Encerra a atual e abre a próxima.
  await db
    .update(temporadas)
    .set({ ativa: false, fim: sql`now()` })
    .where(eq(temporadas.id, atual.id));
  const [nova] = await db.insert(temporadas).values({}).returning();

  // Semeia a nova com XP zerado e o tier recalculado.
  if (membros.length > 0) {
    await db.insert(ligaMembros).values(
      membros.map((m) => ({
        temporadaId: nova.id,
        userId: m.userId,
        nivel: proximoNivel.get(m.userId) ?? m.nivel,
        xpNaTemporada: 0,
      }))
    );
  }

  return {
    temporadaEncerrada: atual.id,
    temporadaNova: nova.id,
    membrosCarregados: membros.length,
  };
}

export interface LinhaLiga {
  userId: string;
  handle: string | null;
  nome: string | null;
  xpNaTemporada: number;
  ehVoce: boolean;
}

/** Ranking do tier do usuário na temporada ativa (o "placar da semana"). */
export async function rankingDaMinhaLiga(userId: string): Promise<{
  nivel: NivelLiga | null;
  linhas: LinhaLiga[];
}> {
  const temp = await temporadaAtiva();
  if (!temp) return { nivel: null, linhas: [] };

  const [meu] = await db
    .select({ nivel: ligaMembros.nivel })
    .from(ligaMembros)
    .where(
      sql`${ligaMembros.temporadaId} = ${temp.id} and ${ligaMembros.userId} = ${userId}`
    )
    .limit(1);

  const nivel = (meu?.nivel ?? "bronze") as NivelLiga;

  const linhas = await db
    .select({
      userId: ligaMembros.userId,
      handle: users.handle,
      nome: users.name,
      banido: users.banido,
      shadowBan: users.shadowBan,
      xpNaTemporada: ligaMembros.xpNaTemporada,
    })
    .from(ligaMembros)
    .innerJoin(users, eq(users.id, ligaMembros.userId))
    .where(
      sql`${ligaMembros.temporadaId} = ${temp.id} and ${ligaMembros.nivel} = ${nivel}`
    )
    .orderBy(desc(ligaMembros.xpNaTemporada))
    .limit(50);

  return {
    nivel,
    // Integridade do ranking: banido/shadow somem, exceto você mesmo.
    linhas: linhas
      .filter((l) => l.userId === userId || (!l.banido && !l.shadowBan))
      .map((l) => ({
        userId: l.userId,
        handle: l.handle,
        nome: l.nome,
        xpNaTemporada: l.xpNaTemporada,
        ehVoce: l.userId === userId,
      })),
  };
}
