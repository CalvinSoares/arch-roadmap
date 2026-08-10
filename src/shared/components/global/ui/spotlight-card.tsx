"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Cor do holofote — CSS var ou cor literal. Default: `var(--primary)`. */
  cor?: string;
  /** Levanta o card no hover. */
  elevar?: boolean;
}

/**
 * Card com holofote radial que segue o cursor (o brilho vaza pela borda) e
 * um leve levantar no hover. O gradiente é desenhado em CSS (`.card-holofote`);
 * aqui só alimentamos as posições via custom properties.
 */
export function SpotlightCard({
  className,
  cor,
  elevar = true,
  style,
  onMouseMove,
  ...props
}: SpotlightCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const aoMover = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (el) {
      const { left, top } = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - left}px`);
      el.style.setProperty("--my", `${e.clientY - top}px`);
    }
    onMouseMove?.(e);
  };

  return (
    <div
      ref={ref}
      onMouseMove={aoMover}
      style={{ ...style, ...(cor ? { ["--holofote" as string]: cor } : null) }}
      className={cn(
        "card-holofote rounded-2xl border border-card-border bg-card",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        elevar &&
          "hover:-translate-y-1 hover:border-transparent hover:shadow-[var(--shadow-lg)]",
        className
      )}
      {...props}
    />
  );
}
