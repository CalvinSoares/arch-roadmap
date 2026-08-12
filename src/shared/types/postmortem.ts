import type { Quando } from "@/shared/types/quando";

/** Um momento da linha do tempo do incidente. */
export interface MomentoDoIncidente {
  /** Relativo ao início: "T+0", "T+4min", "T+3h". Absoluto envelhece mal. */
  quando: string;
  texto: string;
  /** O instante em que a causa vira efeito visível — ganha destaque. */
  virada?: boolean;
}

/**
 * Um incidente público, anotado com os conceitos do catálogo.
 *
 * A regra que separa isto de uma curiosidade: **todo postmortem cita conceitos
 * que existem no catálogo**, e há spec garantindo. Sem essa ligação, é história
 * de terror de plantão; com ela, é a prova de que os padrões importam.
 *
 * Só entram incidentes com relatório público — a `fonte` é obrigatória, pela
 * mesma razão que ela é obrigatória numa data.
 */
export interface Postmortem {
  slug: string;
  titulo: string;
  /** Quem viveu. Nomeado porque o relatório é público e assumido. */
  organizacao: string;
  quando: Quando;
  /** O relatório público. Obrigatório: sem fonte, é boato. */
  fonte: string;
  /** O estrago, em uma linha — é o que faz alguém querer ler o resto. */
  impacto: string;
  /** O que aconteceu, em prosa. 2 a 4 parágrafos. */
  oQueAconteceu: string[];
  linhaDoTempo: MomentoDoIncidente[];
  /**
   * A causa raiz — e ela quase nunca é a ação que disparou o incidente.
   * Um typo não derruba a internet; um sistema que permite que um typo
   * derrube a internet, sim.
   */
  causaRaiz: string;
  /** Conceitos do catálogo que este incidente prova. Validado por spec. */
  conceitos: {
    slug: string;
    /** Por que este conceito aparece aqui. Não é "é relacionado". */
    porque: string;
  }[];
  /** O que a organização mudou depois — a parte que costuma ser ignorada. */
  oQueMudou: string[];
}
