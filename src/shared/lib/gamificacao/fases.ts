import type { RoadmapSection, ProgressoNo } from "@/shared/types/roadmap";

/**
 * Mapa de fases por cima do roadmap. Cada seção vira uma "fase"; concluir uma
 * fase desbloqueia a próxima.
 *
 * O desbloqueio é derivado do progresso (função pura), não guardado: o mapa é
 * estático (Git), o estado por usuário vem do progresso que já existe. Sem
 * tabela nova; se o progresso muda, o mapa recalcula sozinho.
 */

export interface Fase {
  id: string;
  titulo: string;
  /** Total de itens da seção (0 se a seção é o próprio nó). */
  total: number;
  concluidos: number;
  concluida: boolean;
  /** Aberta para o usuário? Primeira sempre; demais quando a anterior conclui. */
  desbloqueada: boolean;
}

/**
 * Monta o mapa a partir das seções e de uma função de status por id de nó (a
 * mesma que o roadmap usa). Uma fase conclui quando todos os seus itens estão
 * `done` (ou, se a seção não tem itens, quando a própria seção está `done`).
 */
export function montarMapaDeFases(
  sections: readonly RoadmapSection[],
  statusDe: (id: string) => ProgressoNo
): Fase[] {
  const fases: Fase[] = [];
  let anteriorConcluida = true; // a primeira fase nasce desbloqueada

  for (const s of sections) {
    const total = s.items.length;
    const concluidos = s.items.filter((it) => statusDe(it.id) === "done").length;
    const concluida =
      total > 0 ? concluidos === total : statusDe(s.id) === "done";

    fases.push({
      id: s.id,
      titulo: s.titulo,
      total,
      concluidos,
      concluida,
      desbloqueada: anteriorConcluida,
    });
    anteriorConcluida = concluida;
  }

  return fases;
}
