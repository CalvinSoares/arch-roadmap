import type { Categoria, Conceito, Dificuldade } from "@/shared/types/conceito";

export type FiltroCategoria = Categoria | "todas";
export type FiltroDificuldade = Dificuldade | "todas";

export const OPCOES_CATEGORIA: { value: FiltroCategoria; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "criacional", label: "Criacional" },
  { value: "estrutural", label: "Estrutural" },
  { value: "comportamental", label: "Comportamental" },
  { value: "principio", label: "Princípio" },
  { value: "arquitetura", label: "Arquitetura" },
];

export const OPCOES_DIFICULDADE: { value: FiltroDificuldade; label: string }[] = [
  { value: "todas", label: "Todos" },
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

/** Rampa de esforço: matcha → ocre → vermelho. */
export const COR_DIFICULDADE: Record<Dificuldade, string> = {
  iniciante: "var(--ok)",
  intermediario: "var(--alerta)",
  avancado: "var(--perigo)",
};

/** Filtra por categoria, nível e busca textual (título, resumo, tags). */
export function filtrarConceitos(
  conceitos: Conceito[],
  categoria: FiltroCategoria,
  dificuldade: FiltroDificuldade,
  busca: string
): Conceito[] {
  const termo = busca.trim().toLowerCase();
  return conceitos.filter((c) => {
    const casaCategoria = categoria === "todas" || c.categoria === categoria;
    const casaDificuldade =
      dificuldade === "todas" || c.dificuldade === dificuldade;
    const casaBusca =
      !termo ||
      c.titulo.toLowerCase().includes(termo) ||
      c.resumo.toLowerCase().includes(termo) ||
      c.tags.some((t) => t.toLowerCase().includes(termo));
    return casaCategoria && casaDificuldade && casaBusca;
  });
}
