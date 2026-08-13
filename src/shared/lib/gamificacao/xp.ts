/**
 * XP, níveis e a curva entre eles — a espinha da gamificação.
 *
 * Tudo aqui é função **pura** e determinística: o nível é **derivado** do XP
 * total, nunca guardado como fonte da verdade. Isso casa com o desenho do plano
 * (ver PLANEJAMENTO-PLATAFORMA.md) — XP é um ledger append-only (`xp_events`) e o
 * nível é projeção. Se a curva mudar um dia, todo mundo é recalculado a partir
 * do mesmo total, sem migração de dado.
 */

/** Quanto cada ação concede. Constantes de propósito — a curva é ajustável. */
export const XP = {
  /** Acertar uma pergunta do quiz. */
  quizAcerto: 10,
  /** Concluir um nó de roadmap. */
  noConcluido: 20,
  /** Resolver um desafio do "quebre isto". */
  desafioResolvido: 30,
  /** Bônus da primeira atividade do dia — o empurrãozinho de retorno. */
  bonusPrimeiraDoDia: 5,
} as const;

export type AcaoXP = keyof typeof XP;

/** XP concedido por uma ação. */
export function xpDaAcao(acao: AcaoXP): number {
  return XP[acao];
}

/**
 * Coeficiente da curva de nível — o **único** botão que ajusta a inclinação.
 *
 * Config-driven de propósito: um A/B futuro troca só este valor por variante
 * (ex.: `curvaDoUsuario(userId)`), sem tocar na fórmula nem migrar dado — como o
 * nível é derivado do XP total, todo mundo é recalculado a partir do mesmo total.
 * Menor = sobe mais rápido; maior = curva mais íngreme.
 */
export const COEF_CURVA = 25;

/**
 * XP acumulado necessário para **alcançar** um nível.
 *
 * O custo de subir de `n` para `n+1` cresce linearmente (100, 150, 200, …),
 * então o acumulado é quadrático: cada nível exige um pouco mais que o anterior,
 * sem explodir. Nível 1 começa em 0.
 *
 *   xpParaNivel(n) = COEF_CURVA · (n − 1) · (n + 2)
 */
export function xpParaNivel(nivel: number, coef: number = COEF_CURVA): number {
  if (nivel <= 1) return 0;
  return coef * (nivel - 1) * (nivel + 2);
}

/**
 * Nível a partir do XP total — a inversa de `xpParaNivel`.
 *
 * Fecha por fórmula e ajusta nas bordas (arredondamento de ponto flutuante),
 * garantindo `nivelPara(xpParaNivel(n)) === n`.
 */
export function nivelPara(xpTotal: number, coef: number = COEF_CURVA): number {
  if (xpTotal <= 0) return 1;
  let n = Math.floor((-1 + Math.sqrt(9 + (4 * xpTotal) / coef)) / 2);
  if (n < 1) n = 1;
  while (xpParaNivel(n + 1, coef) <= xpTotal) n++;
  while (n > 1 && xpParaNivel(n, coef) > xpTotal) n--;
  return n;
}

/** Progresso dentro do nível atual — alimenta a barra de XP. */
export interface ProgressoNivel {
  nivel: number;
  /** XP já conquistado dentro do nível atual. */
  xpNoNivel: number;
  /** XP que o nível atual exige, do começo ao fim. */
  xpDoNivel: number;
  /** Quanto falta para o próximo nível. */
  falta: number;
  /** 0 a 1. */
  pct: number;
}

export function progressoNivel(xpTotal: number): ProgressoNivel {
  const nivel = nivelPara(xpTotal);
  const base = xpParaNivel(nivel);
  const topo = xpParaNivel(nivel + 1);
  const xpDoNivel = topo - base;
  const xpNoNivel = xpTotal - base;
  return {
    nivel,
    xpNoNivel,
    xpDoNivel,
    falta: topo - xpTotal,
    pct: xpDoNivel > 0 ? xpNoNivel / xpDoNivel : 0,
  };
}
