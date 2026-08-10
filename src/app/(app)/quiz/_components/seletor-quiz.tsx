"use client";

import { useState } from "react";
import { LayoutGrid, Map, Shuffle } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { topicosDisponiveis, type TopicoQuiz } from "@/shared/lib/quiz";
import { paraISO } from "@/shared/lib/estudo";
import { Quiz } from "@/app/(app)/estudar/_components/quiz";

/** Tópico "tudo" — o catálogo inteiro, sem escopo. */
const TUDO: TopicoQuiz = {
  id: "tudo",
  titulo: "Catálogo inteiro",
  familia: "categoria",
  slugs: [],
  perguntas: 0,
};

/** Definido fora do componente: criar componentes durante o render remonta a árvore. */
function Grupo({
  titulo,
  icone: Icone,
  itens,
  escolhidoId,
  onEscolher,
}: {
  titulo: string;
  icone: typeof LayoutGrid;
  itens: TopicoQuiz[];
  escolhidoId: string;
  onEscolher: (t: TopicoQuiz) => void;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        <Icone className="size-3.5" />
        {titulo}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {itens.map((t) => {
          const ativo = escolhidoId === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onEscolher(t)}
                aria-pressed={ativo}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-colors",
                  ativo
                    ? "border-primary bg-primary/12 text-primary"
                    : "border-card-border text-muted hover:border-primary/50 hover:text-foreground"
                )}
              >
                {t.titulo}
                {t.perguntas > 0 && (
                  <span className="ml-1.5 tabular-nums opacity-60">
                    {t.perguntas}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SeletorQuiz() {
  const topicos = topicosDisponiveis();
  const [escolhido, setEscolhido] = useState<TopicoQuiz>(TUDO);
  const hoje = paraISO(new Date());

  const categorias = topicos.filter((t) => t.familia === "categoria");
  const trilhas = topicos.filter((t) => t.familia === "trilha");

  return (
    <div className="space-y-8">
      <div className="space-y-5 rounded-2xl border border-card-border bg-card p-5 sm:p-6">
        <Grupo
          titulo="Por categoria"
          icone={LayoutGrid}
          itens={[TUDO, ...categorias]}
          escolhidoId={escolhido.id}
          onEscolher={setEscolhido}
        />
        <Grupo
          titulo="Por trilha"
          icone={Map}
          itens={trilhas}
          escolhidoId={escolhido.id}
          onEscolher={setEscolhido}
        />
      </div>

      <section aria-live="polite">
        <p className="mb-3 flex items-center gap-2 text-sm text-muted">
          <Shuffle className="size-4 shrink-0 text-primary" />
          Jogando: <b className="font-semibold text-foreground">{escolhido.titulo}</b>
          {escolhido.perguntas > 0 && (
            <span className="text-[13px]">
              · {escolhido.perguntas} armadilhas disponíveis
            </span>
          )}
        </p>

        {/*
          `key` força um quiz novo ao trocar de tópico: sem isso o componente
          manteria índice e acertos da rodada anterior.
        */}
        <Quiz
          key={escolhido.id}
          hoje={hoje}
          escopo={escolhido.id === "tudo" ? undefined : escolhido.slugs}
        />
      </section>
    </div>
  );
}
