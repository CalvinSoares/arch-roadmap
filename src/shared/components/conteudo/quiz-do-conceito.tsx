"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { Quiz } from "@/app/(app)/estudar/_components/quiz";
import { paraISO } from "@/shared/lib/estudo";

/**
 * Quiz das armadilhas do próprio conceito, no fim da página dele.
 *
 * Fica atrás de um clique de propósito: quem chegou para ler não deve tropeçar
 * num teste, e quem quer se testar acabou de ler o material.
 */
export function QuizDoConceito({
  slug,
  titulo,
  total,
}: {
  slug: string;
  titulo: string;
  total: number;
}) {
  const [aberto, setAberto] = useState(false);
  const hoje = paraISO(new Date());

  if (total < 2) return null;

  return (
    <section className="border-t border-card-border pt-8">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        Testar o que ficou
      </h2>

      {!aberto ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-card-border bg-card p-5">
          <CircleHelp className="size-4 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted">
            {total} armadilhas de {titulo} viram perguntas — com o nome do
            padrão escondido, misturadas com padrões parecidos.
          </p>
          <Button size="sm" variant="outline" onClick={() => setAberto(true)}>
            Começar
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <Quiz
            hoje={hoje}
            escopo={[slug]}
            quantidade={total}
            vazio={`${titulo} ainda não tem armadilhas suficientes para um quiz.`}
          />
        </div>
      )}
    </section>
  );
}
