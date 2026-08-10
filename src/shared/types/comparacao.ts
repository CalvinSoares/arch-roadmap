/** Um eixo de comparação — vira uma linha da tabela. */
export interface CriterioComparacao {
  /** A pergunta que separa os dois. */
  pergunta: string;
  ladoA: string;
  ladoB: string;
}

/**
 * Um duelo entre dois conceitos que costumam ser confundidos.
 *
 * O slug da rota é **derivado** de `a` e `b` em ordem alfabética
 * (`adapter-vs-facade`), nunca armazenado — assim não existe a possibilidade
 * de duas URLs para o mesmo par.
 */
export interface Comparacao {
  /** slugs de conceito; a ordem aqui é a de exibição, não a da URL. */
  a: string;
  b: string;
  /** O que 90% de quem chega veio buscar, em uma frase. */
  vereditoRapido: string;
  criterios: CriterioComparacao[];
  /** Quando escolher cada um. */
  escolhaA: string;
  escolhaB: string;
  /** O erro que faz as pessoas trocarem um pelo outro. */
  confusaoComum: string;
}

/** `adapter-vs-facade` — sempre em ordem alfabética. */
export function slugComparacao(a: string, b: string): string {
  return [a, b].sort().join("-vs-");
}
