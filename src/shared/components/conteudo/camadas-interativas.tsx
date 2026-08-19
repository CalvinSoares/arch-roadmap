"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, TriangleAlert, Code2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { CamadaNav } from "@/shared/types/bloco";

/**
 * Explorador de camadas em dois painéis: a pilha à esquerda (onde o leitor
 * vê a arquitetura inteira de uma vez) e o detalhe da camada focada à
 * direita. Substitui o acordeão antigo, em que abrir uma camada empurrava
 * todas as outras para fora da vista.
 *
 * Navegação: clique, botões ‹ ›, ou setas do teclado (semântica de tablist).
 */
export function CamadasInterativas({ camadas }: { camadas: CamadaNav[] }) {
  const [ativa, setAtiva] = useState(0);
  const abasRef = useRef<(HTMLButtonElement | null)[]>([]);

  const irPara = useCallback(
    (idx: number, focar = false) => {
      const alvo = Math.max(0, Math.min(camadas.length - 1, idx));
      setAtiva(alvo);
      if (focar) abasRef.current[alvo]?.focus();
    },
    [camadas.length]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      irPara(ativa + 1, true);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      irPara(ativa - 1, true);
    } else if (e.key === "Home") {
      e.preventDefault();
      irPara(0, true);
    } else if (e.key === "End") {
      e.preventDefault();
      irPara(camadas.length - 1, true);
    }
  };

  const atual = camadas[ativa];

  return (
    <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
      {/* Barra de controle */}
      <div className="flex items-center gap-3 border-b border-card-border px-4 py-3">
        <p className="min-w-0 flex-1 truncate text-sm text-muted">
          Camada{" "}
          <span className="font-mono font-semibold text-foreground">
            {ativa + 1}
          </span>
          {/* sem opacity: `text-muted` a 60% caía para 2.96:1 de contraste */}
          <span>/{camadas.length}</span>
          <span aria-hidden className="mx-2 opacity-40">
            ·
          </span>
          <span className="font-medium text-foreground">{atual?.titulo}</span>
        </p>
        <span className="hidden text-[11px] text-muted sm:block">
          use ← →
        </span>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            aria-label="Camada anterior"
            disabled={ativa === 0}
            onClick={() => irPara(ativa - 1)}
            className="rounded-lg border border-card-border p-1.5 text-muted transition-colors hover:border-[var(--acento)] hover:text-[var(--acento)] disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Próxima camada"
            disabled={ativa === camadas.length - 1}
            onClick={() => irPara(ativa + 1)}
            className="rounded-lg border border-card-border p-1.5 text-muted transition-colors hover:border-[var(--acento)] hover:text-[var(--acento)] disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,15.5rem)_minmax(0,1fr)]">
        {/* Pilha de camadas */}
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label="Camadas do conceito"
          onKeyDown={onKeyDown}
          className="flex gap-1.5 overflow-x-auto border-b border-card-border p-3 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r"
        >
          {camadas.map((c, i) => {
            const focada = i === ativa;
            return (
              <button
                key={c.id}
                ref={(el) => {
                  abasRef.current[i] = el;
                }}
                role="tab"
                type="button"
                id={`camada-aba-${c.id}`}
                aria-selected={focada}
                aria-controls={`camada-painel-${c.id}`}
                tabIndex={focada ? 0 : -1}
                onClick={() => irPara(i)}
                className={cn(
                  "group/camada relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left outline-none",
                  "transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring lg:w-full",
                  focada
                    ? "bg-[color-mix(in_srgb,var(--acento)_13%,transparent)]"
                    : "hover:bg-foreground/5"
                )}
              >
                {/* trilho do degrau */}
                <span
                  aria-hidden
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-md font-mono text-[11px] font-bold transition-colors",
                    focada
                      ? "bg-[var(--acento)] text-background"
                      : "bg-foreground/[0.07] text-muted"
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block whitespace-nowrap text-sm font-medium lg:whitespace-normal",
                      focada ? "text-[var(--acento)]" : "text-foreground"
                    )}
                  >
                    {c.titulo}
                  </span>
                  <span className="hidden text-xs leading-snug text-muted lg:block">
                    {c.curto}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Detalhe da camada focada */}
        <div
          role="tabpanel"
          id={`camada-painel-${atual?.id}`}
          aria-labelledby={`camada-aba-${atual?.id}`}
          tabIndex={0}
          className="space-y-4 p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:min-h-[18rem]"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--acento)]">
              Camada {ativa + 1}
            </p>
            {/* h3: o container é uma SecaoConteudo com h2; pular para h4
                quebrava a ordem de cabeçalhos para leitores de tela. */}
            <h3 className="mt-1 text-lg font-semibold tracking-tight">
              {atual?.titulo}
            </h3>
            <p className="mt-0.5 text-sm text-muted">{atual?.curto}</p>
          </div>

          <p className="text-[15px] leading-relaxed text-foreground">
            {atual?.detalhe}
          </p>

          {atual?.exemplo && (
            <div className="overflow-hidden rounded-xl border border-card-border bg-canvas">
              <p className="flex items-center gap-1.5 border-b border-card-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                <Code2 className="size-3" /> No código
              </p>
              {/* snippets de 1–3 linhas: quebram em vez de criar barra de rolagem */}
              <pre className="whitespace-pre-wrap break-words p-3 text-xs leading-relaxed">
                <code className="font-mono">{atual.exemplo}</code>
              </pre>
            </div>
          )}

          {atual?.seViolar && (
            <p className="flex gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--alerta)_28%,transparent)] bg-[color-mix(in_srgb,var(--alerta)_8%,transparent)] p-3.5 text-[13px] leading-relaxed">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--alerta)]" />
              <span>
                <b className="font-semibold">Se violar:</b> {atual.seViolar}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
