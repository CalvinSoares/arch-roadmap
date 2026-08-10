"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { CamadaNav } from "@/shared/types/bloco";

/**
 * Camadas navegáveis: pilha de camadas clicáveis — a focada expande com
 * papel/contratos/mini-exemplo/"se violar"; as demais esmaecem.
 * Navegação por clique, botões anterior/próxima e setas do teclado.
 */
export function CamadasInterativas({ camadas }: { camadas: CamadaNav[] }) {
  const [ativa, setAtiva] = useState(0);
  const listaRef = useRef<HTMLDivElement>(null);

  const irPara = useCallback(
    (idx: number) => setAtiva(Math.max(0, Math.min(camadas.length - 1, idx))),
    [camadas.length]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      irPara(ativa + 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      irPara(ativa - 1);
    }
  };

  const atual = camadas[ativa];

  return (
    <div
      ref={listaRef}
      onKeyDown={onKeyDown}
      className="rounded-xl border border-card-border bg-card p-4 sm:p-5"
    >
      {/* Breadcrumb de profundidade + navegação */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm text-muted">
          Camadas <span className="mx-1 opacity-60">▸</span>
          <span className="font-medium text-foreground">{atual?.titulo}</span>
          <span className="ml-2 text-xs opacity-70">
            {ativa + 1}/{camadas.length}
          </span>
        </p>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            aria-label="Camada anterior"
            disabled={ativa === 0}
            onClick={() => irPara(ativa - 1)}
            className="rounded-md border border-card-border p-1 text-muted transition-colors hover:border-primary hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Próxima camada"
            disabled={ativa === camadas.length - 1}
            onClick={() => irPara(ativa + 1)}
            className="rounded-md border border-card-border p-1 text-muted transition-colors hover:border-primary hover:text-foreground disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Pilha de camadas */}
      <div className="flex flex-col">
        {camadas.map((c, i) => {
          const focada = i === ativa;
          return (
            <div key={c.id} className="flex flex-col items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "h-4 w-px border-l-2 border-dashed transition-colors",
                    focada || i - 1 === ativa
                      ? "border-primary/50"
                      : "border-card-border"
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => irPara(i)}
                aria-expanded={focada}
                className={cn(
                  "w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-300",
                  focada
                    ? "border-primary bg-primary/8"
                    : "border-card-border bg-background opacity-60 hover:opacity-90"
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className={cn("font-medium", focada && "text-primary")}>
                    {c.titulo}
                  </p>
                  <span className="text-xs text-muted">{c.curto}</span>
                </div>

                {/* Detalhe expandido (animação por grid-rows) */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-in-out",
                    focada ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="mt-3 space-y-3 border-t border-card-border pt-3">
                      <p className="text-sm leading-relaxed text-foreground">
                        {c.detalhe}
                      </p>
                      {c.exemplo && (
                        <pre
                          tabIndex={0}
                          className="overflow-x-auto rounded-lg bg-canvas p-3 text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <code className="font-mono">{c.exemplo}</code>
                        </pre>
                      )}
                      {c.seViolar && (
                        <p className="flex gap-2 rounded-lg bg-cat-principio/10 p-3 text-xs leading-relaxed text-foreground">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-cat-principio" />
                          <span>
                            <b>Se violar:</b> {c.seViolar}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Clique numa camada (ou use ←/→) para explorá-la.
      </p>
    </div>
  );
}
