"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Layers, RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { getConceito } from "@/shared/lib/content";
import { CATEGORIAS } from "@/shared/config/categorias";
import { cn } from "@/shared/utils/cn";
import type { Postmortem } from "@/shared/types/postmortem";

/**
 * Antes do spoiler: “o que você colocaria na pilha?”.
 * Revela os conceitos que o incidente prova, com o porquê de cada um.
 */
export function PostmortemJogavel({
  conceitos,
  distratores,
}: {
  conceitos: Postmortem["conceitos"];
  /** Slugs extras para montar a escolha (não são a resposta). */
  distratores: string[];
}) {
  const corretos = useMemo(
    () => new Set(conceitos.map((c) => c.slug)),
    [conceitos]
  );

  const opcoes = useMemo(() => {
    const ids = [...new Set([...conceitos.map((c) => c.slug), ...distratores])];
    // ordem estável por título; evita “as três primeiras são a resposta”
    return ids
      .map((slug) => ({ slug, titulo: getConceito(slug)?.titulo ?? slug }))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  }, [conceitos, distratores]);

  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set());
  const [revelado, setRevelado] = useState(false);

  const alternar = (slug: string) => {
    if (revelado) return;
    setEscolhidos((atual) => {
      const next = new Set(atual);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const reiniciar = () => {
    setEscolhidos(new Set());
    setRevelado(false);
  };

  const acertos = [...escolhidos].filter((s) => corretos.has(s)).length;
  const falsosPositivos = [...escolhidos].filter((s) => !corretos.has(s)).length;
  const faltaram = [...corretos].filter((s) => !escolhidos.has(s)).length;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary"
        >
          <Layers className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            Antes do incidente
          </h2>
          <p className="text-[13px] text-muted">
            O que você colocaria na pilha para conter o estrago?
          </p>
        </div>
      </div>

      {!revelado ? (
        <>
          <ul className="grid gap-2 sm:grid-cols-2">
            {opcoes.map((o) => {
              const on = escolhidos.has(o.slug);
              const cat = getConceito(o.slug)
                ? CATEGORIAS[getConceito(o.slug)!.categoria]
                : null;
              return (
                <li key={o.slug}>
                  <button
                    type="button"
                    onClick={() => alternar(o.slug)}
                    aria-pressed={on}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-colors",
                      on
                        ? "border-primary/50 bg-primary/12 text-primary"
                        : "border-card-border bg-card text-foreground hover:border-primary/40"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md border",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-card-border"
                      )}
                    >
                      {on && <Check className="size-3.5" />}
                    </span>
                    {cat && (
                      <span
                        aria-hidden
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ background: cat.cssVar }}
                      />
                    )}
                    {o.titulo}
                  </button>
                </li>
              );
            })}
          </ul>

          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={escolhidos.size === 0}
            onClick={() => setRevelado(true)}
          >
            Revelar o que faltava
          </Button>
        </>
      ) : (
        <>
          <p className="rounded-xl border border-card-border bg-background px-3.5 py-3 text-[14px] leading-relaxed">
            Você marcou{" "}
            <span className="font-semibold text-foreground">
              {acertos} de {corretos.size}
            </span>{" "}
            que o incidente prova
            {falsosPositivos > 0 && (
              <>
                {" "}
                · {falsosPositivos} a mais
              </>
            )}
            {faltaram > 0 && (
              <>
                {" "}
                · {faltaram} faltando
              </>
            )}
            .
          </p>

          <ul className="space-y-2.5">
            {conceitos.map((c) => {
              const conceito = getConceito(c.slug);
              const cat = conceito ? CATEGORIAS[conceito.categoria] : null;
              const marcou = escolhidos.has(c.slug);
              return (
                <li key={c.slug}>
                  <Link
                    href={`/conceitos/${c.slug}`}
                    className="group/c block rounded-xl border border-card-border bg-card p-4 transition-colors hover:border-primary/45"
                  >
                    <span className="flex flex-wrap items-center gap-2 font-semibold">
                      {cat && (
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full"
                          style={{ background: cat.cssVar }}
                        />
                      )}
                      {conceito?.titulo ?? c.slug}
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          marcou
                            ? "bg-[color-mix(in_srgb,var(--ok)_15%,transparent)] text-[var(--ok)]"
                            : "bg-[color-mix(in_srgb,var(--alerta)_15%,transparent)] text-[var(--alerta)]"
                        )}
                      >
                        {marcou ? "você marcou" : "faltava"}
                      </span>
                      <ArrowUpRight className="size-4 opacity-60 transition-transform duration-300 group-hover/c:-translate-y-0.5 group-hover/c:translate-x-0.5" />
                    </span>
                    <span className="mt-1.5 block text-[14px] leading-relaxed text-muted">
                      <TextoRico>{c.porque}</TextoRico>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={reiniciar}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Tentar de novo
          </button>
        </>
      )}
    </section>
  );
}
