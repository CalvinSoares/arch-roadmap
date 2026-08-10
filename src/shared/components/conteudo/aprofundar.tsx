"use client";

import { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface AprofundarProps {
  children: React.ReactNode;
  /** Quantos parágrafos há dentro — vira a dica de tamanho no cabeçalho. */
  paragrafos?: number;
  /** Uma linha dizendo o que o leitor ganha ao abrir. */
  chamada?: string;
}

/**
 * Aprofundamento opt-in. O gatilho é um painel inteiro (não um link solto):
 * anuncia o que tem dentro e quanto custa ler, então abrir vira uma decisão
 * informada em vez de um clique às cegas.
 */
export function Aprofundar({ children, paragrafos, chamada }: AprofundarProps) {
  const [aberto, setAberto] = useState(false);

  return (
    <div
      className={cn(
        "mt-5 overflow-hidden rounded-xl border transition-colors duration-300",
        aberto
          ? "border-[color-mix(in_srgb,var(--acento)_35%,transparent)] bg-[color-mix(in_srgb,var(--acento)_5%,transparent)]"
          : "border-card-border bg-card"
      )}
    >
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="group/apro flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--acento)_7%,transparent)] focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--acento)_14%,transparent)] text-[var(--acento)]"
        >
          <BookOpen className="size-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            {aberto ? "Recolher aprofundamento" : "Aprofundar"}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {chamada ??
              "Origem do problema, comparação com padrões vizinhos e o porquê das escolhas"}
            {paragrafos ? ` · ${paragrafos} parágrafos` : ""}
          </span>
        </span>

        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted transition-transform duration-300",
            aberto && "rotate-180 text-[var(--acento)]"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-card-border px-4 py-4">
            <div className="space-y-3 border-l-2 border-[color-mix(in_srgb,var(--acento)_30%,transparent)] pl-4 text-[15px] leading-relaxed text-foreground">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
