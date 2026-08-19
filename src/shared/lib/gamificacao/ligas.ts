/**
 * Ligas e a virada semanal de temporada (estilo Duolingo).
 *
 * Função pura: recebe os membros de um tier já ordenados e devolve pra onde
 * cada um vai (promove / mantém / rebaixa). Sem DB e sem relógio; o serviço de
 * virada (cron) faz o I/O em volta. Assim a regra de promoção é testável sem
 * subir um banco.
 */

export const NIVEIS_LIGA = [
  "bronze",
  "prata",
  "ouro",
  "diamante",
  "mestre",
] as const;

export type NivelLiga = (typeof NIVEIS_LIGA)[number];

/** Sobe um tier (satura no topo). */
export function promover(n: NivelLiga): NivelLiga {
  const i = NIVEIS_LIGA.indexOf(n);
  return NIVEIS_LIGA[Math.min(i + 1, NIVEIS_LIGA.length - 1)];
}

/** Desce um tier (satura na base). */
export function rebaixar(n: NivelLiga): NivelLiga {
  const i = NIVEIS_LIGA.indexOf(n);
  return NIVEIS_LIGA[Math.max(i - 1, 0)];
}

export interface RegrasVirada {
  /** Quantos do topo sobem de liga. */
  promover: number;
  /** Quantos da base descem. */
  rebaixar: number;
}

export const REGRAS_PADRAO: RegrasVirada = { promover: 5, rebaixar: 5 };

export interface MembroTier {
  userId: string;
  xpNaTemporada: number;
}

export interface TransicaoLiga {
  userId: string;
  de: NivelLiga;
  para: NivelLiga;
}

/**
 * Classifica os membros de um tier no fim da temporada.
 *
 * Espera a lista já ordenada por XP da temporada (maior primeiro). Regras:
 *  - Quem não pontuou (xp ≤ 0) rebaixa, mesmo que sobre vaga no meio.
 *  - Top `promover` sobem; base `rebaixar` descem; o miolo fica.
 * Ordem determinística (a spec depende): o caller deve desempatar antes (ex.:
 * por `userId`) pra virada ser reprodutível.
 */
export function classificarTier(
  ordenados: readonly MembroTier[],
  nivel: NivelLiga,
  regras: RegrasVirada = REGRAS_PADRAO
): TransicaoLiga[] {
  const total = ordenados.length;
  return ordenados.map((m, i) => {
    const rank = i + 1; // 1-based
    let para: NivelLiga = nivel;
    if (m.xpNaTemporada <= 0) {
      para = rebaixar(nivel);
    } else if (rank <= regras.promover) {
      para = promover(nivel);
    } else if (rank > total - regras.rebaixar) {
      para = rebaixar(nivel);
    }
    return { userId: m.userId, de: nivel, para };
  });
}
