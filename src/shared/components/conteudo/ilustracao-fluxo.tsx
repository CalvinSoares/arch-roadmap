"use client";

import { ArrowRight, ArrowDown } from "lucide-react";
import { Expandivel } from "@/shared/components/conteudo/expandivel";
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
 * Inline: a corrente **quebra linha** em telas estreitas (sem scroll
 * horizontal). Expandido: versão maior, sem quebra, com rolagem, pensada
 * para mobile onde o wrap deixa tudo pequeno demais.
 */
export function IlustracaoFluxo({
  atores,
  setas,
  direcao = "horizontal",
  legenda,
}: Props) {
  return (
    <Expandivel
      titulo="Fluxo"
      descricao={legenda}
      bodyClassName="overflow-x-auto overflow-y-auto p-3 sm:p-5"
      expandido={
        <FluxoFigura
          atores={atores}
          setas={setas}
          direcao={direcao}
          legenda={legenda}
          expandido
        />
      }
    >
      <FluxoFigura
        atores={atores}
        setas={setas}
        direcao={direcao}
        legenda={legenda}
      />
    </Expandivel>
  );
}

function FluxoFigura({
  atores,
  setas,
  direcao = "horizontal",
  legenda,
  expandido = false,
}: Props & { expandido?: boolean }) {
  const horizontal = direcao === "horizontal";
  const Seta = horizontal ? ArrowRight : ArrowDown;

  return (
    <figure
      className={cn(
        "min-w-0 rounded-2xl border border-card-border bg-card",
        expandido
          ? "inline-block max-w-none p-5 sm:p-8"
          : "overflow-hidden px-4 pb-4 pt-12 sm:px-6 sm:pb-6 sm:pt-12"
      )}
    >
      {/*
        Expandido: trilha em w-max dentro de um scroll do dialog (bodyClassName),
        sem overflow no ol; evita clip nas pontas com scroll “fantasma”.
      */}
      <div
        className={cn(
          expandido && horizontal && "w-max min-w-full"
        )}
      >
        <ol
          className={cn(
            "flex items-center",
            horizontal
              ? expandido
                ? "flex-nowrap justify-start gap-y-0"
                : "flex-wrap justify-center gap-y-3"
              : "flex-col gap-y-1",
            expandido && !horizontal && "items-stretch gap-y-2"
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
                  horizontal && "shrink-0"
                )}
              >
                {i > 0 && (
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1 text-muted",
                      horizontal
                        ? cn("flex-col", expandido ? "px-3" : "px-2")
                        : "flex-row gap-2 py-1.5"
                    )}
                  >
                    {seta?.label && (
                      <span
                        className={cn(
                          "text-center leading-tight",
                          expandido
                            ? "max-w-[12rem] text-[13px]"
                            : "max-w-[8.5rem] text-[11px]",
                          !horizontal && "order-2"
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
                          horizontal
                            ? expandido
                              ? "h-px w-8"
                              : "h-px w-5"
                            : expandido
                              ? "h-6 w-px"
                              : "h-4 w-px",
                          seta?.tracejada
                            ? horizontal
                              ? "border-t border-dashed border-current"
                              : "border-l border-dashed border-current"
                            : "bg-current"
                        )}
                      />
                      <Seta
                        className={expandido ? "size-4" : "size-3.5"}
                      />
                    </span>
                  </span>
                )}

                <span
                  className={cn(
                    "flex items-center gap-2 rounded-xl border font-medium transition-colors",
                    expandido
                      ? "px-4 py-2.5 text-base"
                      : "px-3.5 py-2 text-sm",
                    a.destaque
                      ? "border-transparent bg-[var(--acento)] text-background shadow-[0_6px_18px_-8px_color-mix(in_srgb,var(--acento)_85%,transparent)]"
                      : "border-card-border bg-background text-foreground"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "font-mono tabular-nums",
                      expandido ? "text-xs" : "text-[10px]",
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
      </div>

      {/* Legenda só no inline; no expandido já está no DialogDescription */}
      {!expandido && (
        <figcaption className="mt-5 border-t border-card-border pt-3 text-center text-[13px] leading-relaxed text-muted">
          {legenda}
        </figcaption>
      )}
    </figure>
  );
}
