export type Categoria =
  | "criacional"
  | "estrutural"
  | "comportamental"
  | "principio"
  | "arquitetura";

export type Dificuldade = "iniciante" | "intermediario" | "avancado";

export type LinguagemCodigo = "typescript" | "python" | "java";

export interface ExemploCodigo {
  lang: LinguagemCodigo;
  code: string;
}

/** Camada de uma arquitetura para o DiagramaCamadas (React Flow). */
export interface Camada {
  id: string;
  titulo: string;
  descricao?: string;
  /** Destaca a peça onde este conceito atua. */
  destaque?: boolean;
}

export interface Conceito {
  slug: string;
  titulo: string;
  categoria: Categoria;
  resumo: string;
  tags: string[];
  dificuldade: Dificuldade;
  tempoLeitura: number;
  relacionados: string[];
  /*
   * Não existe campo apontando para os roadmaps: a ligação é declarada no
   * item do roadmap (`conceito: "slug"`) e o caminho inverso sai de
   * `roadmapsDoConceito()`. Havia aqui um `roadmapNodes: string[]`, preenchido
   * em todos os conceitos, nunca lido por ninguém e com ids que não existiam
   * mais nos roadmaps — duas fontes de verdade, uma delas silenciosamente
   * errada.
   */
  /** Diagrama de classes/sequência em sintaxe Mermaid. */
  mermaid?: string;
  /** Camadas para a visualização arquitetural. */
  camadas?: Camada[];
  /** Corpo em prosa (parágrafos). Migra para MDX na Fase 1. */
  problema: string[];
  solucao: string[];
  quandoUsar: string[];
  quandoEvitar: string[];
  exemplos: ExemploCodigo[];
  /**
   * Conteúdo rico opcional (imagens/figuras/demos). Quando presente, a
   * página do conceito renderiza estes blocos no lugar do layout clássico.
   */
  blocos?: import("@/shared/types/bloco").Bloco[];
}
