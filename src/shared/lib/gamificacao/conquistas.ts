/**
 * Conquistas (badges) por esforço acumulado.
 *
 * As definições são estáticas e versionadas em Git (como missões e XP); o que
 * o usuário ganhou vai pro banco (`user_conquistas`). A avaliação é função
 * pura: dadas as métricas do usuário, diz quais badges ele já merece. Quem
 * concede (idempotente, uma vez por badge) é o serviço no servidor.
 */

/** As métricas que os critérios de conquista observam. */
export interface MetricasConquista {
  /** XP vitalício (de `user_stats`). */
  xpTotal: number;
  /** Maior streak já alcançado. */
  maiorStreak: number;
  /** Acertos de quiz na conta. */
  quizAcertos: number;
  /** Nós de roadmap concluídos. */
  nosConcluidos: number;
}

export interface Conquista {
  /** Estável; vira `user_conquistas.conquista_chave`. */
  chave: string;
  titulo: string;
  descricao: string;
  /** Qual métrica o critério observa. */
  metrica: keyof MetricasConquista;
  /** Limiar mínimo (inclusivo) para ganhar. */
  limiar: number;
}

export const CONQUISTAS: readonly Conquista[] = [
  {
    chave: "xp-500",
    titulo: "Primeiros passos",
    descricao: "Alcance 500 XP",
    metrica: "xpTotal",
    limiar: 500,
  },
  {
    chave: "xp-5000",
    titulo: "Veterano",
    descricao: "Alcance 5.000 XP",
    metrica: "xpTotal",
    limiar: 5000,
  },
  {
    chave: "streak-7",
    titulo: "Uma semana firme",
    descricao: "Mantenha um streak de 7 dias",
    metrica: "maiorStreak",
    limiar: 7,
  },
  {
    chave: "streak-30",
    titulo: "Inabalável",
    descricao: "Mantenha um streak de 30 dias",
    metrica: "maiorStreak",
    limiar: 30,
  },
  {
    chave: "quiz-100",
    titulo: "Pontaria",
    descricao: "Acerte 100 perguntas no quiz",
    metrica: "quizAcertos",
    limiar: 100,
  },
  {
    chave: "nos-10",
    titulo: "Explorador",
    descricao: "Conclua 10 nós de roadmap",
    metrica: "nosConcluidos",
    limiar: 10,
  },
  {
    chave: "nos-50",
    titulo: "Cartógrafo",
    descricao: "Conclua 50 nós de roadmap",
    metrica: "nosConcluidos",
    limiar: 50,
  },
] as const;

export function acharConquista(chave: string): Conquista | undefined {
  return CONQUISTAS.find((c) => c.chave === chave);
}

/**
 * Chaves de todas as conquistas que as métricas satisfazem. Determinístico e
 * cumulativo (quem já passou de 5.000 XP ganha também a de 500). Quem concede
 * filtra as que o usuário ainda não tem.
 */
export function conquistasGanhas(m: MetricasConquista): string[] {
  return CONQUISTAS.filter((c) => m[c.metrica] >= c.limiar).map((c) => c.chave);
}
