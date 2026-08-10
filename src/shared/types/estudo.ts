/**
 * Agenda de revisão de um conceito.
 *
 * Store separada do progresso do roadmap de propósito: o roadmap é o mapa
 * ("já estudei isto"), a agenda é a memória ("preciso rever isto"). Misturar
 * os dois obrigaria a migrar o formato de quem já marcou trilha inteira.
 */
export interface RevisaoConceito {
  slug: string;
  /** Acertos seguidos. Define o intervalo até a próxima — satura no topo. */
  nivel: number;
  /** ISO `YYYY-MM-DD` da última revisão. */
  revisadoEm: string;
  /** ISO `YYYY-MM-DD`: `revisadoEm` + INTERVALOS[nivel]. */
  proximaEm: string;
}

/** Mapa slug → agenda. É o que vai para o localStorage. */
export type AgendaEstudo = Record<string, RevisaoConceito>;

/**
 * Dias até a próxima revisão, por nível. Curva simples e previsível — não é
 * SM-2, e não precisa ser: o objetivo é espaçar, não modelar esquecimento.
 */
export const INTERVALOS = [1, 3, 7, 16, 35, 90] as const;

export const NIVEL_MAXIMO = INTERVALOS.length - 1;

/** Um item pendente da trilha, pronto para virar sugestão de estudo. */
export interface ProximoDaTrilha {
  conceitoSlug: string;
  conceitoTitulo: string;
  roadmapSlug: string;
  roadmapTitulo: string;
  secaoTitulo: string;
  /** id do nó no roadmap — é por ele que o progresso é marcado. */
  noId: string;
}
