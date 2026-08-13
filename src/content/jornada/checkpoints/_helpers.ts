import type {
  DesafioLacuna,
  DesafioMcq,
  DesafioVf,
} from "@/shared/types/desafio";

/** VF curado — afirmação que ensina, não eco do título do nó. */
export function vf(
  id: string,
  afirmacao: string,
  correta: boolean,
  explicacao: string
): DesafioVf {
  return { tipo: "vf", id, afirmacao, correta, explicacao };
}

/** MCQ com labels livres (não precisa ser slug de conceito). */
export function mcq(
  id: string,
  enunciado: string,
  correta: string,
  opcoes: { id: string; label: string }[],
  explicacao: string
): DesafioMcq {
  return {
    tipo: "mcq",
    id,
    enunciado,
    correta,
    alternativas: opcoes.map((o) => o.id),
    labels: Object.fromEntries(opcoes.map((o) => [o.id, o.label])),
    explicacao,
  };
}

export function lacuna(
  id: string,
  fraseAntes: string,
  fraseDepois: string,
  correta: string,
  opcoes: string[],
  explicacao: string
): DesafioLacuna {
  return {
    tipo: "lacuna",
    id,
    fraseAntes,
    fraseDepois,
    correta,
    opcoes,
    explicacao,
  };
}
