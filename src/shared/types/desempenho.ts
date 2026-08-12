/**
 * Histórico de desempenho no quiz, por conceito.
 *
 * Store separada do progresso do roadmap e da agenda de estudo, de propósito:
 * o roadmap é o mapa ("já estudei isto"), a agenda é a memória ("preciso rever
 * isto"), e isto aqui é o placar ("quantas vezes acertei e errei isto no
 * quiz"). Vazio na chegada — a página do quiz funciona igual sem um dado
 * sequer; o histórico é acréscimo, não a razão de a página existir.
 */
export interface DesempenhoConceito {
  /** Respostas certas para este conceito. */
  acertos: number;
  /** Respostas erradas para este conceito. */
  erros: number;
  /** ISO `YYYY-MM-DD` da última resposta que tocou este conceito. */
  ultimoEm: string;
}

/** Mapa slug → desempenho. É o que vai para o localStorage. */
export type DesempenhoQuiz = Record<string, DesempenhoConceito>;

/** Um conceito no ranking de pontos fracos. */
export interface PontoFraco {
  slug: string;
  acertos: number;
  erros: number;
  total: number;
  /** erros / total, de 0 a 1. */
  taxaErro: number;
}

/** Os números do rodapé: quanto foi respondido e a taxa de acerto geral. */
export interface TotaisDesempenho {
  respostas: number;
  acertos: number;
  erros: number;
  /** Conceitos com ao menos uma resposta. */
  conceitos: number;
  /** acertos / respostas, de 0 a 1. Zero quando não há respostas. */
  taxaAcerto: number;
}
