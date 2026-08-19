import type { ProgressoNo } from "@/shared/types/roadmap";

/**
 * Merge da migração local→conta (função pura). No login, o progresso do
 * localStorage entra na conta sem sobrescrever o que já existe lá: vence o
 * status mais avançado, empate mantém o servidor. Um "done" nunca regride.
 *
 * Sem DB e sem relógio: recebe o local e o servidor, devolve só o que o
 * servidor precisa gravar (mesmo padrão de `xp.ts`/`streak.ts`).
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

/** Uma trilha e os ids dos seus nós (o que o split por roadmap precisa). */
export interface RoadmapNos {
  slug: string;
  noIds: readonly string[];
}

/**
 * Divide o estado plano da conta (`noId → status`) nos mapas por trilha que a
 * UI guarda em `localStorage` (`DevMappa:progress:<slug>`). O servidor grava o
 * progresso achatado por nó (sem o slug), então semear cada chave exige
 * reagrupar por roadmap.
 *
 * Um mesmo `noId` presente em duas trilhas entra nas duas (o DB não guarda a
 * que trilha o nó pertence). `noId`s que não existem em nenhuma trilha
 * (estado velho/inválido) são descartados.
 *
 * Função pura: recebe os ids de nó de cada roadmap, não importa o catálogo.
 */
export function estadoPorRoadmap(
  estado: Readonly<Record<string, ProgressoNo>>,
  roadmaps: readonly RoadmapNos[]
): Record<string, Record<string, ProgressoNo>> {
  const porSlug: Record<string, Record<string, ProgressoNo>> = {};
  for (const { slug, noIds } of roadmaps) {
    const mapa: Record<string, ProgressoNo> = {};
    for (const noId of noIds) {
      const status = estado[noId];
      if (status !== undefined) mapa[noId] = status;
    }
    porSlug[slug] = mapa;
  }
  return porSlug;
}
