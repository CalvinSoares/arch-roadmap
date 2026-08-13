"use client";

import { useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type { ProgressoNo } from "@/shared/types/roadmap";
import { useArmazenamentoLocal } from "@/shared/hook/use-armazenamento-local";
import { definirProgresso } from "@/server/gamificacao/acoes";

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
 * Progresso do usuário por nó do roadmap.
 *
 * Híbrido por design (o princípio "login é acréscimo, não portão"): o
 * localStorage é sempre a fonte da UI — instantâneo, funciona anônimo. Quando há
 * sessão, cada mudança é **espelhada** para a conta (write-through), onde o
 * servidor persiste e, na conclusão de um nó, concede o XP de forma idempotente.
 * O espelho é fire-and-forget: uma falha de rede não trava o clique local.
 */
export function useRoadmapProgress(slug: string, totalNos: number) {
  const [mapa, persistir] = useArmazenamentoLocal(chave(slug), VAZIO);
  const { status: auth } = useSession();
  const logado = auth === "authenticated";

  const espelhar = useCallback(
    (id: string, status: ProgressoNo) => {
      if (!logado) return;
      void definirProgresso({ roadmapSlug: slug, noId: id, status })
        .then((r) => {
          if (!r?.ok) return;
          if (r.subiuNivel && r.nivel) {
            toast.success(`Subiu para o nível ${r.nivel}! 🎉`);
          } else if (r.xp) {
            toast.success(`Nó concluído · +${r.xp} XP`);
          }
        })
        .catch(() => {
          /* offline/erro — o local já refletiu; tenta de novo na próxima ação */
        });
    },
    [logado, slug]
  );

  const statusDe = useCallback(
    (id: string): ProgressoNo => mapa[id] ?? "pending",
    [mapa]
  );

  const ciclar = useCallback(
    (id: string) => {
      const atual = mapa[id] ?? "pending";
      const proximo = PROXIMO[atual];
      persistir({ ...mapa, [id]: proximo });
      espelhar(id, proximo);
    },
    [mapa, persistir, espelhar]
  );

  const definir = useCallback(
    (id: string, status: ProgressoNo) => {
      persistir({ ...mapa, [id]: status });
      espelhar(id, status);
    },
    [mapa, persistir, espelhar]
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
