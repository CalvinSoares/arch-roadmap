import * as React from "react";
import { cn } from "@/shared/utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Mostra um ponto de status herdando a cor do texto. */
  ponto?: boolean;
}

export function Badge({ className, ponto, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]",
        "ring-1 ring-inset ring-current/15 transition-colors duration-300",
        className
      )}
      {...props}
    >
      {ponto && (
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}
