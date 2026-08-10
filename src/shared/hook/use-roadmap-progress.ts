"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProgressoNo } from "@/shared/types/roadmap";

type Mapa = Record<string, ProgressoNo>;

const chave = (slug: string) => `devatlas:progress:${slug}`;

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
  const [mapa, setMapa] = useState<Mapa>({});
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    try {
      const bruto = localStorage.getItem(chave(slug));
      setMapa(bruto ? (JSON.parse(bruto) as Mapa) : {});
    } catch {
      setMapa({});
    }
    setHidratado(true);
  }, [slug]);

  const persistir = useCallback(
    (proximo: Mapa) => {
      setMapa(proximo);
      try {
        localStorage.setItem(chave(slug), JSON.stringify(proximo));
      } catch {
        /* storage indisponível — ignora */
      }
    },
    [slug]
  );

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

  return { statusDe, ciclar, definir, resetar, contagem, hidratado };
}
