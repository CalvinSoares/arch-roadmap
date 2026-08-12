"use client";

import { useCallback } from "react";
import { useArmazenamentoLocal } from "@/shared/hook/use-armazenamento-local";
import { registrar as registrarPuro } from "@/shared/lib/desempenho";
import { paraISO } from "@/shared/lib/estudo";
import type { DesempenhoQuiz } from "@/shared/types/desempenho";

const CHAVE = "DevMappa:quiz-desempenho";
/** Constante de módulo: o padrão precisa ser referencialmente estável. */
const VAZIO: DesempenhoQuiz = {};

/**
 * Histórico de acertos/erros do quiz, persistido em localStorage (front-only).
 * Vazio na chegada; cada resposta do quiz o alimenta via `registrar`.
 */
export function useDesempenhoQuiz() {
  const [desempenho, persistir] = useArmazenamentoLocal(CHAVE, VAZIO);

  const registrar = useCallback(
    (slug: string, acertou: boolean) =>
      persistir(registrarPuro(desempenho, slug, acertou, paraISO(new Date()))),
    [desempenho, persistir]
  );

  const resetar = useCallback(() => persistir(VAZIO), [persistir]);

  return { desempenho, registrar, resetar };
}
