"use client";

import { useMemo, useState } from "react";
import { Quiz } from "@/shared/components/conteudo/quiz";
import { useDesempenhoQuiz } from "@/shared/hook/use-desempenho-quiz";
import { topicosDisponiveis, type TopicoQuiz } from "@/shared/lib/quiz";
import { paraISO } from "@/shared/lib/estudo";
import { cn } from "@/shared/utils/cn";

const TUDO: TopicoQuiz = {
  id: "tudo",
  titulo: "Catálogo inteiro",
  familia: "categoria",
  slugs: [],
  perguntas: 0,
};

/**
 * Entrevista cronometrada: 5 explique-erro + 2 duelos, 10 min.
 * Mora no hub do Modo entrevista, não no Quiz.
 */
export function EntrevistaCodigo() {
  const trilhas = useMemo(
    () => topicosDisponiveis().filter((t) => t.familia === "trilha"),
    []
  );
  const [trilha, setTrilha] = useState<TopicoQuiz>(TUDO);
  const { registrar } = useDesempenhoQuiz();
  const hoje = paraISO(new Date());
  const escopo = trilha.id === "tudo" ? undefined : trilha.slugs;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-card-border bg-card p-4 sm:p-5">
        <p className="text-[14px] leading-relaxed text-muted">
          Dez minutos no relógio. Cinco trechos quebrados e dois duelos
          {trilha.id !== "tudo" ? (
            <>
              {" "}
              da trilha <span className="text-foreground">{trilha.titulo}</span>
            </>
          ) : (
            " do catálogo"
          )}
          . No final aparece o que vale reler.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTrilha(TUDO)}
            aria-pressed={trilha.id === "tudo"}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition-colors",
              trilha.id === "tudo"
                ? "border-primary bg-primary/12 text-primary"
                : "border-card-border text-muted hover:border-primary/45 hover:text-foreground"
            )}
          >
            Catálogo inteiro
          </button>
          {trilhas.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrilha(t)}
              aria-pressed={trilha.id === t.id}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                trilha.id === t.id
                  ? "border-primary bg-primary/12 text-primary"
                  : "border-card-border text-muted hover:border-primary/45 hover:text-foreground"
              )}
            >
              {t.titulo}
            </button>
          ))}
        </div>
      </div>

      <Quiz
        key={`entrevista-codigo:${trilha.id}`}
        hoje={hoje}
        escopo={escopo}
        entrevista
        onResponder={registrar}
        vazio="Não há perguntas suficientes nesta trilha. Escolha outra ou o catálogo inteiro."
      />
    </div>
  );
}
