/** Progresso do usuário por nó (persistido em localStorage). */
export type ProgressoNo = "pending" | "done" | "in-progress" | "skipped";

/** Item (subtópico) de uma seção do roadmap. */
export interface RoadmapItem {
  id: string;
  titulo: string;
  /** slug do conceito que este item abre (se houver). */
  conceito?: string;
  descricao?: string;
  /** caminho opcional/alternativo (visual tracejado). */
  opcional?: boolean;
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
