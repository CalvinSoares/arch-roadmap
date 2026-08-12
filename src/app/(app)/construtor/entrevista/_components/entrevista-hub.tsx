"use client";

import { useState } from "react";
import { cn } from "@/shared/utils/cn";
import type { Entrevista } from "@/shared/types/entrevista";
import { EntrevistaSala } from "./entrevista-sala";
import { EntrevistaCodigo } from "./entrevista-codigo";

type Modo = "system-design" | "codigo";

/**
 * Hub do Modo entrevista: system design (rubrica) ou código cronometrado.
 */
export function EntrevistaHub({ entrevistas }: { entrevistas: Entrevista[] }) {
  const [modo, setModo] = useState<Modo>("system-design");

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Tipo de entrevista"
        className="grid grid-cols-2 gap-1 rounded-xl border border-card-border bg-card p-1"
      >
        {(
          [
            {
              id: "system-design" as const,
              label: "System design",
              hint: "Enunciado + rubrica",
            },
            {
              id: "codigo" as const,
              label: "Código",
              hint: "10 min, explique-erro e duelos",
            },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={modo === m.id}
            onClick={() => setModo(m.id)}
            className={cn(
              "min-h-12 rounded-lg px-3 py-2 text-left transition-colors",
              modo === m.id
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <span className="block text-sm font-semibold">{m.label}</span>
            <span
              className={cn(
                "block text-[11px]",
                modo === m.id
                  ? "text-primary-foreground/80"
                  : "text-muted"
              )}
            >
              {m.hint}
            </span>
          </button>
        ))}
      </div>

      {modo === "system-design" ? (
        <EntrevistaSala entrevistas={entrevistas} />
      ) : (
        <EntrevistaCodigo />
      )}
    </div>
  );
}
