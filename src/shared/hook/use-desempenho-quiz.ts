import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useArmazenamentoLocal } from "@/shared/hook/use-armazenamento-local";
import { registrar as registrarPuro } from "@/shared/lib/desempenho";
import { paraISO } from "@/shared/lib/estudo";
import type { DesempenhoQuiz } from "@/shared/types/desempenho";
import type { ProvaRespostaQuiz } from "@/shared/lib/quiz/avaliar-prova";
import { registrarAcertoQuiz } from "@/server/gamificacao/acoes";

const CHAVE = "DevMappa:quiz-desempenho";
/** Constante de módulo: o padrão precisa ser referencialmente estável. */
const VAZIO: DesempenhoQuiz = {};

export type OpcoesRegistroQuiz = {
  /**
   * Concede XP no servidor (default: true).
   * Desligar em replay da jornada — `tentativaId` novo farmava XP a cada acerto.
   */
  creditarXp?: boolean;
  /**
   * Toast `+XP` por resposta (default: true).
   * Na jornada fica off: o toast de conclusão do nó já cobre a recompensa.
   * Subida de nível ainda notifica.
   */
  toastXp?: boolean;
  /**
   * Grava no mapa local de desempenho por conceito (default: true).
   * Desligar para chaves `checkpoint:…` — não são verbetes.
   */
  desempenhoLocal?: boolean;
  /**
   * Contexto + resposta para o servidor regenerar o gabarito.
   * Sem prova, não há crédito de XP (o boolean local não basta).
   */
  prova?: ProvaRespostaQuiz;
};

/**
 * Histórico de acertos/erros do quiz.
 *
 * Híbrido: o localStorage segue como fonte imediata da UI (vazio na chegada,
 * funciona anônimo). Havendo sessão e `prova`, cada resposta vai ao servidor —
 * que **regenera** a pergunta/desafio e decide o acerto. O cliente nunca manda
 * `acertou` para pagar XP.
 */
export function useDesempenhoQuiz() {
  const [desempenho, persistir] = useArmazenamentoLocal(CHAVE, VAZIO);
  const { status: auth } = useSession();
  const logado = auth === "authenticated";

  const registrar = useCallback(
    (slug: string, acertou: boolean, opcoes?: OpcoesRegistroQuiz) => {
      const desempenhoLocal = opcoes?.desempenhoLocal !== false;
      const creditarXp = opcoes?.creditarXp !== false;
      const toastXp = opcoes?.toastXp !== false;
      const prova = opcoes?.prova;

      if (desempenhoLocal) {
        persistir(registrarPuro(desempenho, slug, acertou, paraISO(new Date())));
      }

      if (!logado || !creditarXp || !prova) return;

      void registrarAcertoQuiz({
        tentativaId: crypto.randomUUID(),
        prova,
      })
        .then((r) => {
          if (!r?.ok) return;
          if (r.subiuNivel && r.nivel) {
            toast.success(`Subiu para o nível ${r.nivel}! 🎉`);
          } else if (toastXp && r.xp) {
            toast.success(`+${r.xp} XP`);
          }
        })
        .catch(() => {
          /* offline/erro — o histórico local já refletiu quando aplicável */
        });
    },
    [desempenho, persistir, logado]
  );

  const resetar = useCallback(() => persistir(VAZIO), [persistir]);

  return { desempenho, registrar, resetar };
}
