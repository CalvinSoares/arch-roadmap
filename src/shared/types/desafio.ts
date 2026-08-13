import type { FormatoQuiz } from "@/shared/lib/quiz-formatos";

/** Tipos de desafio jogáveis na jornada. */
export type TipoDesafio =
  | "mcq"
  | "vf"
  | "lacuna"
  | "ordenar"
  | "parear"
  | "dois-codigos";

export const ROTULO_DESAFIO: Record<TipoDesafio, string> = {
  mcq: "Escolha",
  vf: "Verdadeiro ou falso",
  lacuna: "Complete",
  ordenar: "Ordene",
  parear: "Pareie",
  "dois-codigos": "Qual código?",
};

/** Múltipla escolha — ids nas alternativas; `labels` resolve o texto do botão. */
export interface DesafioMcq {
  tipo: "mcq";
  id: string;
  enunciado: string;
  /** Id da alternativa correta. */
  correta: string;
  alternativas: string[];
  /** Texto exibido por id. Sem entrada, a UI tenta o título do conceito. */
  labels?: Record<string, string>;
  explicacao: string;
  formato?: FormatoQuiz;
  codigo?: string;
}

export interface DesafioVf {
  tipo: "vf";
  id: string;
  afirmacao: string;
  correta: boolean;
  explicacao: string;
}

export interface DesafioLacuna {
  tipo: "lacuna";
  id: string;
  fraseAntes: string;
  fraseDepois: string;
  correta: string;
  opcoes: string[];
  explicacao: string;
}

export interface DesafioOrdenar {
  tipo: "ordenar";
  id: string;
  enunciado: string;
  itens: { id: string; label: string }[];
  ordemCorreta: string[];
  explicacao: string;
}

export interface DesafioParear {
  tipo: "parear";
  id: string;
  enunciado: string;
  pares: { esquerda: string; direita: string }[];
  explicacao: string;
}

export interface DesafioDoisCodigos {
  tipo: "dois-codigos";
  id: string;
  enunciado: string;
  a: string;
  b: string;
  correta: "a" | "b";
  explicacao: string;
}

export type Desafio =
  | DesafioMcq
  | DesafioVf
  | DesafioLacuna
  | DesafioOrdenar
  | DesafioParear
  | DesafioDoisCodigos;

/** Resposta do usuário, discriminada pelo tipo do desafio. */
export type RespostaDesafio =
  | { tipo: "mcq"; escolha: string }
  | { tipo: "vf"; escolha: boolean }
  | { tipo: "lacuna"; escolha: string }
  | { tipo: "ordenar"; ordem: string[] }
  | { tipo: "parear"; ligacoes: Record<string, string> }
  | { tipo: "dois-codigos"; escolha: "a" | "b" };
