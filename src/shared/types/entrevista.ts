/**
 * Um problema de system design com a rubrica que o avalia.
 *
 * O "quebre isto" e o comparador cobrem duas metades práticas do desenho de
 * sistemas — achar o defeito num desenho pronto e escolher entre dois. A
 * entrevista cobre a terceira: partir de um enunciado em branco e projetar. A
 * rubrica não pontua sozinha; é o checklist com que você se avalia **depois**
 * de ter pensado no desenho, do essencial ao bônus.
 */
export type NivelRubrica = "essencial" | "importante" | "bonus";

export interface ItemRubrica {
  /** O ponto que uma boa resposta levanta. */
  ponto: string;
  /** Por que importa — o que quebra se for ignorado. */
  porque: string;
  /** Conceitos do catálogo que sustentam este ponto. */
  conceitos: string[];
  nivel: NivelRubrica;
}

export interface Entrevista {
  slug: string;
  titulo: string;
  /** Uma linha: o que se pede. */
  resumo: string;
  /** O enunciado completo do problema. */
  enunciado: string;
  /** Requisitos e restrições que delimitam o escopo. */
  restricoes: string[];
  /** A rubrica: o que separa uma resposta forte de uma fraca. */
  rubrica: ItemRubrica[];
  /** A armadilha comum: o caminho que parece certo e cobra caro. */
  pegadinha: string;
}
