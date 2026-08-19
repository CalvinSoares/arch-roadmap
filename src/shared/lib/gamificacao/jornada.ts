import type {
  RoadmapSection,
  ProgressoNo,
  RecursoRoadmap,
} from "@/shared/types/roadmap";

/**
 * Jornada (P1): a trilha de jogo derivada de um roadmap. Seções viram
 * unidades e itens viram nós; o desbloqueio é sequencial (estilo Duolingo):
 * tudo concluído até o primeiro nó pendente, que é o atual; o resto fica
 * bloqueado.
 *
 * Função pura: recebe as seções + o status por id de nó (o mesmo progresso
 * que o roadmap já usa) e devolve as unidades com o estado de cada nó. Sem DB
 * e sem tabela nova; o estado é derivado do progresso existente.
 */

export type EstadoNo = "done" | "current" | "locked";

export interface NoJornada {
  id: string;
  titulo: string;
  /** slug do conceito, quando o nó abre uma página de conceito. */
  conceito?: string;
  /** Contexto do nó de checkpoint (sem conceito), mostrado antes de concluir. */
  descricao?: string;
  /** Links curados de um checkpoint de leitura (sem conceito). */
  recursos?: RecursoRoadmap[];
  estado: EstadoNo;
}

export interface UnidadeJornada {
  id: string;
  titulo: string;
  descricao?: string;
  nos: NoJornada[];
}

export function montarJornada(
  sections: readonly RoadmapSection[],
  statusDe: (id: string) => ProgressoNo
): UnidadeJornada[] {
  // Índice (na sequência achatada) do primeiro nó ainda não concluído.
  const flat = sections.flatMap((s) => s.items);
  const idxAtual = flat.findIndex((it) => statusDe(it.id) !== "done");

  let pos = 0;
  return sections.map((s) => ({
    id: s.id,
    titulo: s.titulo,
    descricao: s.descricao,
    nos: s.items.map((it) => {
      const estado: EstadoNo =
        statusDe(it.id) === "done"
          ? "done"
          : idxAtual !== -1 && pos === idxAtual
            ? "current"
            : "locked";
      pos++;
      return {
        id: it.id,
        titulo: it.titulo,
        conceito: it.conceito,
        descricao: it.descricao,
        recursos: it.recursos,
        estado,
      };
    }),
  }));
}

/** Contagem concluídos/total; alimenta o cabeçalho e o seletor de jornadas. */
export function progressoJornada(
  sections: readonly RoadmapSection[],
  statusDe: (id: string) => ProgressoNo
): { concluidos: number; total: number } {
  const flat = sections.flatMap((s) => s.items);
  const concluidos = flat.filter((it) => statusDe(it.id) === "done").length;
  return { concluidos, total: flat.length };
}
