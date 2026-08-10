import type { Categoria, Conceito } from "@/shared/types/conceito";

export type FiltroCategoria = Categoria | "todas";

export const OPCOES_CATEGORIA: { value: FiltroCategoria; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "criacional", label: "Criacional" },
  { value: "estrutural", label: "Estrutural" },
  { value: "comportamental", label: "Comportamental" },
  { value: "principio", label: "Princípio" },
  { value: "arquitetura", label: "Arquitetura" },
];

/** Filtra por categoria e busca textual (título, resumo, tags). */
export function filtrarConceitos(
  conceitos: Conceito[],
  categoria: FiltroCategoria,
  busca: string
): Conceito[] {
  const termo = busca.trim().toLowerCase();
  return conceitos.filter((c) => {
    const casaCategoria = categoria === "todas" || c.categoria === categoria;
    const casaBusca =
      !termo ||
      c.titulo.toLowerCase().includes(termo) ||
      c.resumo.toLowerCase().includes(termo) ||
      c.tags.some((t) => t.toLowerCase().includes(termo));
    return casaCategoria && casaBusca;
  });
}
