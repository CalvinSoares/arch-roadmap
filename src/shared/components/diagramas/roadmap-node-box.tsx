"use client";

import { Check, Minus, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { ProgressoNo } from "@/shared/types/roadmap";

export function StatusCheck({
  progresso,
  onToggle,
}: {
  progresso: ProgressoNo;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Marcar progresso"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        // z-10: fica acima do overlay clicável do card (padrão nested-interactive)
        "relative z-10 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
        progresso === "done"
          ? "border-cat-criacional bg-cat-criacional/15"
          : progresso === "in-progress"
            ? "border-cat-principio bg-cat-principio/15"
            : "border-card-border bg-background hover:border-primary"
      )}
    >
      {progresso === "done" && (
        <Check className="size-3.5 text-cat-criacional" strokeWidth={3} />
      )}
      {progresso === "in-progress" && (
        <Minus className="size-3.5 text-cat-principio" strokeWidth={3} />
      )}
      {progresso === "skipped" && (
        <X className="size-3.5 text-muted" strokeWidth={3} />
      )}
    </button>
  );
}

/** Classe de tint aplicada conforme o progresso. */
export function statusClasses(progresso: ProgressoNo) {
  return cn(
    progresso === "done" && "border-cat-criacional/60 bg-cat-criacional/8",
    progresso === "in-progress" && "border-cat-principio/60 bg-cat-principio/8",
    progresso === "skipped" && "opacity-55 [&_.titulo]:line-through"
  );
}
