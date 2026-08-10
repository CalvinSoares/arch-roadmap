export type ContentErrorCategory =
  | "nao-encontrado"
  | "conteudo-invalido"
  | "diagrama-falhou"
  | "desconhecido";

export interface ResolvedContentError {
  title: string;
  description: string;
  category: ContentErrorCategory;
}

const FALLBACK: Record<ContentErrorCategory, ResolvedContentError> = {
  "nao-encontrado": {
    category: "nao-encontrado",
    title: "Conteúdo não encontrado",
    description: "O item que você procura não existe ou foi movido.",
  },
  "conteudo-invalido": {
    category: "conteudo-invalido",
    title: "Não foi possível exibir este conteúdo",
    description: "Houve um problema ao carregar este material. Tente novamente.",
  },
  "diagrama-falhou": {
    category: "diagrama-falhou",
    title: "Não foi possível renderizar o diagrama",
    description: "O diagrama não pôde ser desenhado. Veja o código-fonte abaixo.",
  },
  desconhecido: {
    category: "desconhecido",
    title: "Algo não saiu como esperado",
    description: "Tente novamente em instantes.",
  },
};

/**
 * Categoriza uma falha de conteúdo em `{ title, description }`.
 * Regra herdada do padrão de erros do PaaS: mensagem técnica (stack,
 * parse) NUNCA vai para a UI — apenas categoria + dica de ação.
 */
export function resolveContentError(
  error: unknown,
  hint?: ContentErrorCategory
): ResolvedContentError {
  if (hint) return FALLBACK[hint];

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("not found") || message.includes("nao encontrado")) {
    return FALLBACK["nao-encontrado"];
  }
  if (message.includes("mermaid") || message.includes("diagram")) {
    return FALLBACK["diagrama-falhou"];
  }
  return FALLBACK.desconhecido;
}
