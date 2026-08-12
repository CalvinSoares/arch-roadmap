/**
 * Datas que não são números.
 *
 * Uma data em história de software raramente é um instante: o GoF de 1994
 * catalogou padrões que já existiam, Hexagonal foi publicado e revisado ao longo
 * de anos, e a cunhagem de CQRS não tem marco único. Modelar tudo como
 * `ano: number` obriga a mentir em metade dos casos.
 *
 * A saída é separar **o que se escreve** (`rotulo`) do **que se calcula** (`ano`),
 * e nomear a incerteza em vez de escondê-la (`precisao`).
 *
 * Compartilhado entre o campo `nasceu` do conceito e, futuramente, os momentos
 * da cronologia — os dois falam da mesma coisa.
 */

/**
 * Quão firme é a data. Muda o texto exibido e o desenho do marcador —
 * **nunca** o cálculo de posição, que usa sempre `ano`.
 */
export type Precisao =
  /** Está no livro, com dia e mês se preciso. */
  | "exata"
  /** Ordem de grandeza: "c. 3000 a.C.", "meados dos anos 70". */
  | "aproximada"
  /** Cabe em cem anos: "séc. XIII". */
  | "seculo"
  /** Durou: "1347–1351". Exige `ate`. */
  | "intervalo"
  /** Marco didático, não evento: o GoF não inventou os padrões em 1994. */
  | "convencao"
  /** As fontes divergem. Exige `disputa`. */
  | "disputada";

export interface Quando {
  /** Como se escreve para gente. É isto que aparece na tela. */
  rotulo: string;
  /**
   * Ano canônico, para ordenar e posicionar. Negativo = a.C.
   *
   * O ano 0 não existe (de 1 a.C. para 1 d.C. passa um ano, não dois) e há
   * spec proibindo. Em `intervalo`, é o início; em `seculo`, o ano do meio.
   */
  ano: number;
  /** Fim do intervalo. Obrigatório — e só permitido — em `precisao: "intervalo"`. */
  ate?: number;
  precisao: Precisao;
  /** Obrigatório em `disputada`: a outra data defendida, e por quem. */
  disputa?: string;
}

/** Quando uma ideia foi **nomeada** — que raramente é quando ela foi inventada. */
export interface Nascimento {
  quando: Quando;
  /** O paper, o livro, a conferência. Obrigatório: data sem fonte é boato. */
  fonte: string;
  /**
   * Onde a ideia já aparecia antes de ter nome. É o campo que mais ensina —
   * "Observer, 1994" é trivia; "e já estava no MVC do Smalltalk em 1979" é aula.
   */
  precursor?: string;
}

/**
 * Distância em anos entre dois anos canônicos, ciente de que o ano 0 não existe.
 *
 * `distanciaAnos(-1, 1)` é 1, não 2. Função pura — a spec depende disso.
 */
export function distanciaAnos(de: number, ate: number): number {
  if (de === 0 || ate === 0) {
    throw new RangeError("ano 0 não existe: use -1 para 1 a.C. e 1 para 1 d.C.");
  }
  const bruto = ate - de;
  // cruzou a virada da era: descontar o zero que ninguém viveu
  if (de < 0 && ate > 0) return bruto - 1;
  if (de > 0 && ate < 0) return bruto + 1;
  return bruto;
}
