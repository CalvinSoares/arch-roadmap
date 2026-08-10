"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/utils/cn";

export interface SecaoNav {
  id: string;
  titulo: string;
}

/** Scroll-spy compartilhado pelas duas apresentações do índice. */
function useSecaoAtiva(secoes: SecaoNav[]) {
  const [ativa, setAtiva] = useState(secoes[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // a seção visível mais próxima do topo vence
        const visiveis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visiveis[0]) setAtiva(visiveis[0].target.id);
      },
      { rootMargin: "-88px 0px -62% 0px", threshold: 0 }
    );
    secoes.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [secoes]);

  const irPara = (id: string) => {
    setAtiva(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return { ativa, irPara };
}

/**
 * Fita de chips presa ao topo — apresentação do índice até `xl`.
 * Some acima disso, onde a trilha vertical assume.
 */
export function SubnavFita({ secoes }: { secoes: SecaoNav[] }) {
  const { ativa, irPara } = useSecaoAtiva(secoes);

  return (
    <nav
      aria-label="Seções do conceito"
      className="sticky top-14 z-20 -mx-4 border-y border-card-border bg-canvas/85 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:hidden"
    >
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {secoes.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => irPara(s.id)}
            aria-current={ativa === s.id ? "true" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] transition-colors",
              ativa === s.id
                ? "bg-[color-mix(in_srgb,var(--acento)_16%,transparent)] font-semibold text-[var(--acento)]"
                : "text-muted hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            {/* sem opacity: a 10px, `text-muted` a 70% caía para 3.67:1 */}
            <span className="font-mono text-[10px]">
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.titulo}
          </button>
        ))}
      </div>
    </nav>
  );
}

/**
 * Trilha vertical do índice (xl+): um trilho que se preenche conforme a
 * leitura avança, dando ao leitor a noção de "quanto falta".
 */
export function SubnavTrilha({ secoes }: { secoes: SecaoNav[] }) {
  const { ativa, irPara } = useSecaoAtiva(secoes);
  const indiceAtivo = Math.max(
    0,
    secoes.findIndex((s) => s.id === ativa)
  );
  const progresso =
    secoes.length > 1 ? indiceAtivo / (secoes.length - 1) : 1;

  return (
    <nav
      aria-label="Seções do conceito"
      className="hidden xl:sticky xl:top-20 xl:block xl:self-start"
    >
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        Nesta página
      </p>
      <div className="relative">
        {/* trilho + preenchimento de progresso */}
        <span
          aria-hidden
          className="absolute bottom-2 left-[7px] top-2 w-px bg-card-border"
        />
        <span
          aria-hidden
          className="absolute left-[7px] top-2 w-px bg-[var(--acento)] transition-[height] duration-500 ease-out"
          style={{ height: `calc((100% - 1rem) * ${progresso})` }}
        />

        <ul className="flex flex-col gap-0.5">
          {secoes.map((s, i) => {
            const ativo = ativa === s.id;
            const passado = i < indiceAtivo;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => irPara(s.id)}
                  aria-current={ativo ? "true" : undefined}
                  className={cn(
                    "group/toc flex w-full items-start gap-3 rounded-lg py-1.5 pr-2 text-left text-[13px] leading-snug transition-colors",
                    ativo
                      ? "font-semibold text-[var(--acento)]"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "relative z-10 mt-[5px] size-[7px] shrink-0 rounded-full ring-4 ring-canvas transition-all duration-300",
                      ativo
                        ? "scale-125 bg-[var(--acento)]"
                        : passado
                          ? "bg-[var(--acento)] opacity-60"
                          : "bg-card-border group-hover/toc:bg-muted"
                    )}
                  />
                  <span className="min-w-0">{s.titulo}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
