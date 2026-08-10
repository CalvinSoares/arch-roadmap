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
  /** Nós de roadmap que referenciam este conceito. */
  roadmapNodes: string[];
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
