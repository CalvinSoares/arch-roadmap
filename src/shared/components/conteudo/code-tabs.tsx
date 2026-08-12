"use client";

import { useId, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useCopy } from "@/shared/hook/use-copy";
import { LINGUAGENS } from "@/shared/config/categorias";
import { cn } from "@/shared/utils/cn";
import type { LinguagemCodigo } from "@/shared/types/conceito";

export interface ExemploDestacado {
  lang: LinguagemCodigo;
  code: string;
  /** HTML gerado pelo Shiki no servidor. */
  html: string;
}

/**
 * Janela de código: barra de título com as linguagens como abas e o botão
 * copiar; o bloco do Shiki entra rente às bordas (sem card dentro de card).
 */
export function CodeTabs({ exemplos }: { exemplos: ExemploDestacado[] }) {
  const [ativo, setAtivo] = useState<LinguagemCodigo>(
    exemplos[0]?.lang ?? "typescript"
  );
  const { copied, copy } = useCopy();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const abasRef = useRef<(HTMLButtonElement | null)[]>([]);

  if (exemplos.length === 0) return null;

  const idAba = (lang: string) => `aba-${uid}-${lang}`;
  const idPainel = (lang: string) => `painel-${uid}-${lang}`;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = exemplos.findIndex((ex) => ex.lang === ativo);
    let prox = i;
    if (e.key === "ArrowRight") prox = (i + 1) % exemplos.length;
    else if (e.key === "ArrowLeft") prox = (i - 1 + exemplos.length) % exemplos.length;
    else return;
    e.preventDefault();
    setAtivo(exemplos[prox].lang);
    abasRef.current[prox]?.focus();
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-card-border bg-card">
      <div className="flex items-center gap-2 border-b border-card-border px-2">
        <div
          role="tablist"
          aria-label="Linguagem do exemplo"
          onKeyDown={onKeyDown}
          className="flex min-w-0 flex-1 overflow-x-auto"
        >
          {exemplos.map((ex, i) => {
            const sel = ex.lang === ativo;
            return (
              <button
                key={ex.lang}
                ref={(el) => {
                  abasRef.current[i] = el;
                }}
                type="button"
                role="tab"
                id={idAba(ex.lang)}
                aria-selected={sel}
                aria-controls={idPainel(ex.lang)}
                tabIndex={sel ? 0 : -1}
                onClick={() => setAtivo(ex.lang)}
                className={cn(
                  "relative shrink-0 px-3.5 py-2.5 text-[13px] font-medium outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  sel ? "text-[var(--acento)]" : "text-muted hover:text-foreground"
                )}
              >
                {LINGUAGENS[ex.lang] ?? ex.lang}
                {sel && (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 bottom-0 h-[2px] rounded-t-full bg-[var(--acento)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => copy(exemplos.find((e) => e.lang === ativo)?.code ?? "")}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring",
            copied
              ? "text-[var(--ok)]"
              : "text-muted hover:bg-foreground/5 hover:text-foreground"
          )}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      {exemplos.map((ex) => (
        <div
          key={ex.lang}
          role="tabpanel"
          id={idPainel(ex.lang)}
          aria-labelledby={idAba(ex.lang)}
          hidden={ex.lang !== ativo}
          className="max-w-full overflow-x-auto overscroll-x-contain [&_pre]:!m-0 [&_pre]:!max-w-none [&_pre]:!rounded-none [&_pre]:!border-0"
          dangerouslySetInnerHTML={{ __html: ex.html }}
        />
      ))}
    </div>
  );
}
