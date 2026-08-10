/** Natureza de uma mudança dentro de uma entrega. */
export type TipoMudanca = "conteudo" | "novo" | "melhoria" | "correcao";

export interface Mudanca {
  tipo: TipoMudanca;
  texto: string;
}

/**
 * Algo planejado e ainda não entregue — vira o bloco "A seguir" na página de
 * novidades. Quando a feature sai, a entrada morre daqui e renasce como
 * `Mudanca` numa entrega; os dois nunca coexistem.
 */
export interface ItemPlanejado {
  /** id estável — o componente mapeia para o ícone por ele. */
  id: string;
  titulo: string;
  descricao: string;
}

/**
 * Uma entrega publicada. É a **fonte única** do que mudou e quando: o badge
 * "novo" do catálogo deriva daqui, então nada precisa ser marcado à mão em
 * dois lugares.
 */
export interface Novidade {
  /** Versão semântica da entrega. */
  versao: string;
  /** Data de publicação em ISO (`YYYY-MM-DD`). */
  data: string;
  titulo: string;
  resumo: string;
  /**
   * Marco de abertura do projeto. O conteúdo que veio junto **não** ganha
   * badge de novo — quando tudo é novo, nada é novo.
   */
  lancamentoInicial?: boolean;
  mudancas: Mudanca[];
  /** Slugs de conceitos que estrearam nesta entrega. */
  conceitos?: string[];
  /** Slugs de roadmaps que estrearam nesta entrega. */
  roadmaps?: string[];
}
