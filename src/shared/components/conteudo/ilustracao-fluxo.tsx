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
 * Arquétipo "fluxo": cadeia linear de atores com setas rotuladas.
 * HTML/flex theme-aware — sem medição, sem quebra de layout (scroll-x próprio).
 */
export function IlustracaoFluxo({ atores, setas, direcao = "horizontal", legenda }: Props) {
  const horizontal = direcao === "horizontal";
  const Seta = horizontal ? ArrowRight : ArrowDown;

  return (
    <figure className="rounded-xl border border-card-border bg-card p-5">
      <div
        tabIndex={horizontal ? 0 : undefined}
        role={horizontal ? "group" : undefined}
        aria-label={horizontal ? legenda : undefined}
        className={cn(
          "flex items-center gap-2",
          horizontal ? "overflow-x-auto pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : "flex-col"
        )}
      >
        {atores.map((a, i) => (
          <div
            key={a.id}
            className={cn("flex items-center gap-2", !horizontal && "flex-col")}
          >
            {i > 0 && (
              <div
                className={cn(
                  "flex items-center gap-1 text-muted",
                  !horizontal && "flex-col"
                )}
              >
                <Seta
                  className={cn("size-4 shrink-0", setas[i - 1]?.tracejada && "opacity-50")}
                />
                {setas[i - 1]?.label && (
                  <span className="whitespace-nowrap text-[11px]">{setas[i - 1].label}</span>
                )}
              </div>
            )}
            <div
              className={cn(
                "whitespace-nowrap rounded-lg border px-3.5 py-2 text-sm font-medium",
                a.destaque
                  ? "border-2 border-primary bg-primary/10 text-primary"
                  : "border-card-border bg-background text-foreground"
              )}
            >
              {a.label}
            </div>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">{legenda}</figcaption>
    </figure>
  );
}
