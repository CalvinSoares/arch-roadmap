import { ArrowRight, ArrowDown } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { FluxoAtor, FluxoSeta } from "@/shared/types/bloco";

interface Props {
  atores: FluxoAtor[];
  setas: FluxoSeta[];
  direcao?: "horizontal" | "vertical";
  legenda: string;
}

/**
 * Cadeia linear de atores com setas rotuladas.
 *
 * A corrente **quebra linha** em vez de rolar horizontalmente: cada elo
 * (seta + ator) é uma unidade indivisível, então o fluxo se reorganiza em
 * telas estreitas sem barra de rolagem e sem seta órfã no fim da linha.
 */
export function IlustracaoFluxo({
  atores,
  setas,
  direcao = "horizontal",
  legenda,
}: Props) {
  const horizontal = direcao === "horizontal";
  const Seta = horizontal ? ArrowRight : ArrowDown;

  return (
    <figure className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
      <ol
        className={cn(
          "flex items-center",
          horizontal
            ? "flex-wrap justify-center gap-y-3"
            : "flex-col gap-y-1"
        )}
      >
        {atores.map((a, i) => {
          const seta = setas[i - 1];
          return (
            <li
              key={a.id}
              className={cn(
                "flex items-center",
                !horizontal && "flex-col",
                // o elo não quebra por dentro: seta e ator andam juntos
                horizontal && "shrink-0"
              )}
            >
              {i > 0 && (
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 text-muted",
                    horizontal ? "flex-col px-2" : "flex-row gap-2 py-1.5"
                  )}
                >
                  {seta?.label && (
                    <span
                      className={cn(
                        "text-center text-[11px] leading-tight",
                        horizontal ? "max-w-[8.5rem]" : "order-2"
                      )}
                    >
                      {seta.label}
                    </span>
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      "flex items-center",
                      horizontal ? "gap-0.5" : "flex-col gap-0.5"
                    )}
                  >
                    <span
                      className={cn(
                        horizontal ? "h-px w-5" : "h-4 w-px",
                        seta?.tracejada
                          ? horizontal
                            ? "border-t border-dashed border-current"
                            : "border-l border-dashed border-current"
                          : "bg-current"
                      )}
                    />
                    <Seta className="size-3.5" />
                  </span>
                </span>
              )}

              <span
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                  a.destaque
                    ? "border-transparent bg-[var(--acento)] text-background shadow-[0_6px_18px_-8px_color-mix(in_srgb,var(--acento)_85%,transparent)]"
                    : "border-card-border bg-background text-foreground"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "font-mono text-[10px] tabular-nums",
                    a.destaque ? "opacity-70" : "text-muted"
                  )}
                >
                  {i + 1}
                </span>
                {a.label}
              </span>
            </li>
          );
        })}
      </ol>

      <figcaption className="mt-5 border-t border-card-border pt-3 text-center text-[13px] leading-relaxed text-muted">
        {legenda}
      </figcaption>
    </figure>
  );
}
