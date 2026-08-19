/**
 * Missões diárias ("acerte 5 perguntas", "conclua 1 nó"). A definição é
 * estática e versionada em Git; só o progresso do usuário vai pro banco
 * (`missao_progresso`).
 *
 * Tudo aqui é função pura: recebe estado + gatilho, devolve o novo estado.
 * Nada de `new Date()` nem DB, o dia entra por parâmetro (mesmo padrão de
 * `xp.ts`/`streak.ts`).
 */

/** O evento que faz uma missão avançar. Mais amplo que `AcaoXP` de propósito:
 *  "responder" conta acerto e erro; "acertar" só o acerto. */
export type GatilhoMissao =
  | "quizResposta"
  | "quizAcerto"
  | "noConcluido"
  | "desafioResolvido";

export interface Missao {
  /** Estável; vira chave em `missao_progresso.missao_id`. */
  id: string;
  titulo: string;
  descricao: string;
  gatilho: GatilhoMissao;
  /** Quantas vezes o gatilho precisa disparar para concluir. */
  meta: number;
  /** XP concedido ao concluir. */
  xpRecompensa: number;
}

/**
 * Pool de missões diárias. A cada dia, um subconjunto é sorteado de forma
 * determinística pela data (ver `missoesDoDia`): o mesmo dia rende sempre as
 * mesmas missões, e a spec e o `missao_progresso` dependem disso. Manter as
 * metas alcançáveis.
 */
export const MISSOES_DIARIAS: readonly Missao[] = [
  {
    id: "acerte-5",
    titulo: "Afiado",
    descricao: "Acerte 5 perguntas do quiz",
    gatilho: "quizAcerto",
    meta: 5,
    xpRecompensa: 20,
  },
  {
    id: "conclua-1-no",
    titulo: "Avançar",
    descricao: "Conclua 1 nó de um roadmap",
    gatilho: "noConcluido",
    meta: 1,
    xpRecompensa: 15,
  },
  {
    id: "pratique-10",
    titulo: "Constância",
    descricao: "Responda 10 perguntas (acertando ou errando)",
    gatilho: "quizResposta",
    meta: 10,
    xpRecompensa: 10,
  },
  {
    id: "acerte-15",
    titulo: "Em chamas",
    descricao: "Acerte 15 perguntas do quiz",
    gatilho: "quizAcerto",
    meta: 15,
    xpRecompensa: 40,
  },
  {
    id: "conclua-3-nos",
    titulo: "Maratona",
    descricao: "Conclua 3 nós de roadmap",
    gatilho: "noConcluido",
    meta: 3,
    xpRecompensa: 35,
  },
  {
    id: "desafio-1",
    titulo: "Quebre isto",
    descricao: "Resolva 1 desafio do 'quebre isto'",
    gatilho: "desafioResolvido",
    meta: 1,
    xpRecompensa: 25,
  },
] as const;

/** Quantas missões ativas por dia. */
export const MISSOES_POR_DIA = 3;

/** Hash determinístico e estável de uma data ISO (sem `Math.random`). */
function semente(dia: string): number {
  let h = 0;
  for (let i = 0; i < dia.length; i++) {
    h = (h * 31 + dia.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Missões ativas em `dia` (ISO YYYY-MM-DD): subconjunto rotativo do pool,
 * escolhido de forma determinística pela data. Sem `dia`, devolve o pool
 * inteiro (útil pra telas de referência).
 */
export function missoesDoDia(dia?: string): readonly Missao[] {
  if (!dia) return MISSOES_DIARIAS;
  const inicio = semente(dia) % MISSOES_DIARIAS.length;
  const n = Math.min(MISSOES_POR_DIA, MISSOES_DIARIAS.length);
  const out: Missao[] = [];
  for (let i = 0; i < n; i++) {
    out.push(MISSOES_DIARIAS[(inicio + i) % MISSOES_DIARIAS.length]);
  }
  return out;
}

/** Busca uma missão pela chave estável (procura no pool inteiro). */
export function acharMissao(id: string): Missao | undefined {
  return MISSOES_DIARIAS.find((m) => m.id === id);
}

export interface ProgressoMissao {
  progresso: number;
  concluida: boolean;
}

export interface ResultadoMissao {
  estado: ProgressoMissao;
  /** A missão foi concluída agora (dispara a recompensa uma única vez). */
  recemConcluida: boolean;
}

/**
 * Avança uma missão por um gatilho. Gatilho que não bate com a missão não faz
 * nada. Uma vez concluída, não avança nem reconclui (recompensa só uma vez).
 */
export function avancarMissao(
  missao: Missao,
  estado: ProgressoMissao,
  gatilho: GatilhoMissao,
  quantidade = 1
): ResultadoMissao {
  if (estado.concluida || missao.gatilho !== gatilho || quantidade <= 0) {
    return { estado, recemConcluida: false };
  }
  const progresso = Math.min(missao.meta, estado.progresso + quantidade);
  const concluida = progresso >= missao.meta;
  return {
    estado: { progresso, concluida },
    recemConcluida: concluida,
  };
}
