"use client";

import { useCallback, useMemo } from "react";
import type { ProgressoNo } from "@/shared/types/roadmap";
import { useArmazenamentoLocal } from "@/shared/hook/use-armazenamento-local";

type Mapa = Record<string, ProgressoNo>;

const chave = (slug: string) => `DevMappa:progress:${slug}`;
/** Constante de módulo: o padrão precisa ser referencialmente estável. */
const VAZIO: Mapa = {};

/** Ciclo ao clicar no check: pendente → concluído → pulado → pendente. */
const PROXIMO: Record<ProgressoNo, ProgressoNo> = {
  pending: "done",
  done: "skipped",
  skipped: "pending",
  "in-progress": "done",
};

/**
 * Progresso do usuário por nó do roadmap, persistido em localStorage
 * (front-only, sem backend). Uma instância vive no RoadmapFlow.
 */
export function useRoadmapProgress(slug: string, totalNos: number) {
  const [mapa, persistir] = useArmazenamentoLocal(chave(slug), VAZIO);

  const statusDe = useCallback(
    (id: string): ProgressoNo => mapa[id] ?? "pending",
    [mapa]
  );

  const ciclar = useCallback(
    (id: string) => {
      const atual = mapa[id] ?? "pending";
      persistir({ ...mapa, [id]: PROXIMO[atual] });
    },
    [mapa, persistir]
  );

  const definir = useCallback(
    (id: string, status: ProgressoNo) => persistir({ ...mapa, [id]: status }),
    [mapa, persistir]
  );

  const resetar = useCallback(() => persistir({}), [persistir]);

  const contagem = useMemo(() => {
    const concluidos = Object.values(mapa).filter((s) => s === "done").length;
    return {
      concluidos,
      total: totalNos,
      pct: totalNos ? Math.round((concluidos / totalNos) * 100) : 0,
    };
  }, [mapa, totalNos]);

  return { statusDe, ciclar, definir, resetar, contagem };
}
