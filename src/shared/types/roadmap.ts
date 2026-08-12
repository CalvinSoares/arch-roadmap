/** Progresso do usuário por nó (persistido em localStorage). */
export type ProgressoNo = "pending" | "done" | "in-progress" | "skipped";

/** Tipo de um recurso externo — pinta o rótulo no painel. */
export type TipoRecurso =
  | "doc"
  | "artigo"
  | "spec"
  | "video"
  | "curso"
  | "ferramenta";

/**
 * Um link externo curado, no espírito do roadmap.sh: o que ler para dar conta
 * de um nó que não é conceito do catálogo (Git, HTTP, CSS). Fonte estável e
 * canônica de propósito — MDN, docs oficiais, web.dev — para envelhecer bem.
 */
export interface RecursoRoadmap {
  titulo: string;
  /** Absoluto e https. */
  href: string;
  tipo: TipoRecurso;
  /** Fonte legível: "MDN", "web.dev", "OWASP". */
  fonte?: string;
}

/** Item (subtópico) de uma seção do roadmap. */
export interface RoadmapItem {
  id: string;
  titulo: string;
  /** slug do conceito que este item abre (se houver). */
  conceito?: string;
  descricao?: string;
  /** caminho opcional/alternativo (visual tracejado). */
  opcional?: boolean;
  /**
   * Ids de outros itens **deste** roadmap que precisam vir antes.
   * Vira aresta no grafo — a ordem da lista deixa de ser o único sinal.
   */
  prerequisitos?: string[];
  /**
   * Marca o núcleo da trilha. Com o toggle "só o essencial", o resto some.
   */
  essencial?: boolean;
  /** Links externos curados para tópicos sem página de conceito. */
  recursos?: RecursoRoadmap[];
}

/** Seção (tópico principal) na espinha do roadmap. */
export interface RoadmapSection {
  id: string;
  titulo: string;
  descricao?: string;
  conceito?: string;
  items: RoadmapItem[];
}

export interface Roadmap {
  slug: string;
  titulo: string;
  descricao: string;
  sections: RoadmapSection[];
}
