"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useArmazenamentoLocal } from "@/shared/hook/use-armazenamento-local";
import { registrar as registrarPuro } from "@/shared/lib/desempenho";
import { paraISO } from "@/shared/lib/estudo";
import type { DesempenhoQuiz } from "@/shared/types/desempenho";
import { registrarAcertoQuiz } from "@/server/gamificacao/acoes";

const CHAVE = "DevMappa:quiz-desempenho";
/** Constante de módulo: o padrão precisa ser referencialmente estável. */
const VAZIO: DesempenhoQuiz = {};

/**
 * Histórico de acertos/erros do quiz.
 *
 * Híbrido: o localStorage segue como fonte imediata da UI (vazio na chegada,
 * funciona anônimo). Havendo sessão, cada resposta é **reportada** ao servidor
 * com um `tentativaId` único (uuid) — o servidor grava a tentativa e concede o
 * XP do acerto de forma idempotente (retry de rede não conta duas vezes). É o
 * cliente reportando a *ação*, nunca o XP.
 */
export function useDesempenhoQuiz() {
  const [desempenho, persistir] = useArmazenamentoLocal(CHAVE, VAZIO);
  const { status: auth } = useSession();
  const logado = auth === "authenticated";

  const registrar = useCallback(
    (slug: string, acertou: boolean) => {
      persistir(registrarPuro(desempenho, slug, acertou, paraISO(new Date())));
      if (logado) {
        void registrarAcertoQuiz({
          tentativaId: crypto.randomUUID(),
          conceitoSlug: slug,
          acertou,
        })
          .then((r) => {
            if (!r?.ok) return;
            if (r.subiuNivel && r.nivel) {
              toast.success(`Subiu para o nível ${r.nivel}! 🎉`);
            } else if (r.xp) {
              toast.success(`+${r.xp} XP`);
            }
          })
          .catch(() => {
            /* offline/erro — o histórico local já refletiu */
          });
      }
    },
    [desempenho, persistir, logado]
  );

  const resetar = useCallback(() => persistir(VAZIO), [persistir]);

  return { desempenho, registrar, resetar };
}
