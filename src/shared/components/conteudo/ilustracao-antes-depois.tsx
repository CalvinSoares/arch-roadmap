"use client";

import { useId, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { LadoComparacao } from "@/shared/types/bloco";

interface Props {
  antes: LadoComparacao;
  depois: LadoComparacao;
  legenda: string;
}

function Painel({
  id,
  lado,
  positivo,
  className,
}: {
  id: string;
  lado: LadoComparacao;
  positivo: boolean;
  className?: string;
}) {
  const Icone = positivo ? Check : X;
  return (
    <div
      id={id}
      role="tabpanel"
      className={cn(
        "flex min-w-0 flex-col rounded-xl border p-4",
        positivo
          ? "border-[var(--acento)]/45 bg-[color-mix(in_srgb,var(--acento)_8%,transparent)]"
          : "border-card-border bg-background",
        className
      )}
    >
      <p
        className={cn(
          "text-[13px] font-semibold",
          positivo ? "text-[var(--acento)]" : "text-muted"
        )}
      >
        {lado.titulo}
      </p>

      <ul className="mt-2.5 flex-1 space-y-1.5">
        {lado.itens.map((item) => (
          <li key={item} className="flex gap-2 text-[13px] leading-relaxed">
            <Icone
              aria-hidden
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                positivo ? "text-[var(--acento)]" : "text-muted"
              )}
            />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>

      <p
        className={cn(
          "mt-3 border-t pt-2.5 text-[11px] leading-relaxed",
          positivo
            ? "border-[var(--acento)]/25 text-foreground"
            : "border-card-border text-muted"
        )}
      >
        {lado.nota}
      </p>
    </div>
  );
}

/**
 * Dois painéis "sem o padrão × com o padrão", o arquétipo "antes-depois".
 *
 * No desktop os dois aparecem lado a lado (a comparação é o conteúdo). No
 * mobile, onde duas colunas ficariam ilegíveis, vira um alternador: os dois
 * painéis continuam no DOM (busca do navegador e leitor de tela acham ambos)
 * e o CSS decide qual mostrar; o `hidden` só vale abaixo de `sm`.
 */
export function IlustracaoAntesDepois({ antes, depois, legenda }: Props) {
  const [lado, setLado] = useState<"antes" | "depois">("depois");
  const id = useId();

  return (
    <figure className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
      {/* Alternador só no mobile; no desktop os dois painéis já estão visíveis */}
      <div
        role="tablist"
        aria-label="Comparar antes e depois"
        className="mb-4 grid grid-cols-2 gap-1 rounded-lg border border-card-border p-1 sm:hidden"
      >
        {(["antes", "depois"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={lado === k}
            aria-controls={`${id}-${k}`}
            onClick={() => setLado(k)}
            className={cn(
              "truncate rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              lado === k
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:text-foreground"
            )}
          >
            {k === "antes" ? antes.titulo : depois.titulo}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Painel
          id={`${id}-antes`}
          lado={antes}
          positivo={false}
          className={cn(lado !== "antes" && "hidden sm:flex")}
        />
        <Painel
          id={`${id}-depois`}
          lado={depois}
          positivo
          className={cn(lado !== "depois" && "hidden sm:flex")}
        />
      </div>

      <figcaption className="mt-5 border-t border-card-border pt-3 text-center text-[13px] leading-relaxed text-muted">
        {legenda}
      </figcaption>
    </figure>
  );
}
