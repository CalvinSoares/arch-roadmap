export type CamadaId =
  | "ui"
  | "api"
  | "aplicacao"
  | "dominio"
  | "infra"
  | "read-store"
  | "write-store"
  | "fila";

export interface CamadaDef {
  id: CamadaId;
  nome: string;
  descricao: string;
}

export interface PadraoDef {
  /** slug do conceito correspondente (linka para /conceitos/[slug]). */
  id: string;
  nome: string;
  descricao: string;
  /** camadas recomendadas — soltar fora delas é permitido e gera alerta didático. */
  aplicaEm: CamadaId[];
}

export type CategoriaTech =
  | "cache"
  | "banco"
  | "fila"
  | "busca"
  | "borda"
  | "storage"
  | "observabilidade";

export interface TecnologiaDef {
  id: string;
  nome: string;
  categoria: CategoriaTech;
  /** frase-resumo mostrada na paleta/tooltip. */
  descricao: string;
  /** camadas onde a tecnologia tipicamente vive — fora delas gera alerta. */
  viveEm: CamadaId[];
  /** usos típicos (ficha). */
  usos: string[];
  /** ficha técnica compacta. */
  especificacoes: {
    modelo: string;
    persistencia: string;
    consistencia: string;
    latencia: string;
  };
  /** o que muda no projeto ao adotá-la (custo/benefício honesto). */
  diferencaQueFaz: string;
  alternativas: string[];
  /** slugs de conceitos relacionados (viram links na ficha). */
  conceitos?: string[];
}

export interface CamadaNoProjeto {
  camadaId: CamadaId;
  padroes: string[];
  /** tecnologias concretas aplicadas nesta camada (ids de TecnologiaDef). */
  tecnologias: string[];
}

export interface EstadoProjeto {
  /** ordenadas de cima (mais próxima do usuário) para baixo (infra). */
  camadas: CamadaNoProjeto[];
}

export type NivelInsight = "sinergia" | "alerta" | "info";

export interface Insight {
  id: string;
  nivel: NivelInsight;
  titulo: string;
  explicacao: string;
  /** slugs de conceitos relacionados (viram links). */
  conceitos?: string[];
}

export interface Regra extends Omit<Insight, "id"> {
  id: string;
  quando: (p: EstadoProjeto) => boolean;
}

export interface ScoreProjeto {
  desacoplamento: number;
  testabilidade: number;
  complexidade: number;
  fatores: string[];
}

export interface TemplateProjeto {
  id: string;
  nome: string;
  descricao: string;
  /** 3 bullets explicando as decisões do modelo (narrados ao carregar). */
  porQue: string[];
  estado: EstadoProjeto;
}
