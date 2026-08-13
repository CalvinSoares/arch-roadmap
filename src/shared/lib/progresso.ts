import type { ProgressoNo } from "@/shared/types/roadmap";

/**
 * Mescla de progresso — a lógica da migração local→conta, em função **pura**.
 *
 * Quando o anônimo (que só tinha `localStorage`) faz login, o progresso do
 * dispositivo precisa entrar na conta sem atropelar o que já houver no servidor.
 * A regra: **vence o estado mais avançado**; empate mantém o servidor. Assim um
 * "concluído" nunca vira "pendente", venha de onde vier.
 *
 * Sem DB e sem relógio: recebe o local e o servidor, devolve só o que o servidor
 * precisa gravar. Testável isolada, no padrão de `xp.ts`/`streak.ts`.
 */

/** Quanto cada status "vale": o maior vence a mescla. */
const PRIORIDADE: Record<ProgressoNo, number> = {
  done: 3,
  "in-progress": 2,
  skipped: 1,
  pending: 0,
};

function ehStatus(v: unknown): v is ProgressoNo {
  return typeof v === "string" && v in PRIORIDADE;
}

export interface EntradaProgresso {
  noId: string;
  status: ProgressoNo;
}

/**
 * Devolve as entradas que o servidor deve gravar para absorver o progresso
 * local. Entrada crua/inválida é ignorada; duplicatas no local colapsam no
 * status mais avançado; entradas que o servidor já iguala ou supera são
 * descartadas (nada para gravar).
 */
export function mesclarProgresso(
  local: readonly { noId: unknown; status: unknown }[],
  servidor: Readonly<Record<string, ProgressoNo>>
): EntradaProgresso[] {
  // 1) melhor status local por nó (colapsa duplicatas do próprio dispositivo)
  const melhorLocal = new Map<string, ProgressoNo>();
  for (const { noId, status } of local) {
    if (typeof noId !== "string" || !noId || !ehStatus(status)) continue;
    const atual = melhorLocal.get(noId);
    if (atual === undefined || PRIORIDADE[status] > PRIORIDADE[atual]) {
      melhorLocal.set(noId, status);
    }
  }

  // 2) só grava quando o local supera o servidor (empate = servidor vence)
  const escrever: EntradaProgresso[] = [];
  for (const [noId, status] of melhorLocal) {
    const noServidor = servidor[noId];
    if (noServidor !== undefined && PRIORIDADE[status] <= PRIORIDADE[noServidor]) {
      continue;
    }
    escrever.push({ noId, status });
  }
  return escrever;
}
