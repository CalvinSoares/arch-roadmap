"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, AlertTriangle, ArrowUpRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { getConceito } from "@/shared/lib/content";
import type { Entrevista, NivelRubrica } from "@/shared/types/entrevista";

const NIVEL_ORDEM: NivelRubrica[] = ["essencial", "importante", "bonus"];

const NIVEL_ROTULO: Record<NivelRubrica, string> = {
  essencial: "Essencial",
  importante: "Importante",
  bonus: "Bônus",
};

/** Acento por nível — reaproveita os tokens de categoria do catálogo. */
const NIVEL_COR: Record<NivelRubrica, string> = {
  essencial: "var(--cat-principio)",
  importante: "var(--cat-arquitetura)",
  bonus: "var(--cat-estrutural)",
};

const NIVEL_LEGENDA: Record<NivelRubrica, string> = {
  essencial: "sem isto, a resposta está errada",
  importante: "separa uma resposta boa de uma apenas ok",
  bonus: "o que impressiona quando o resto já está de pé",
};

export function EntrevistaSala({ entrevistas }: { entrevistas: Entrevista[] }) {
  const [escolhida, setEscolhida] = useState(entrevistas[0]);
  const [revelada, setRevelada] = useState(false);

  const trocar = (e: Entrevista) => {
    setEscolhida(e);
    setRevelada(false); // volta a esconder a rubrica ao mudar de problema
  };

  return (
    <div className="space-y-4">
      {/* ——— Seletor de enunciados ——— */}
      <div className="flex flex-wrap gap-1.5">
        {entrevistas.map((e) => (
          <button
            key={e.slug}
            type="button"
            onClick={() => trocar(e)}
            aria-pressed={escolhida.slug === e.slug}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[13px] font-medium transition-colors",
              escolhida.slug === e.slug
                ? "border-primary bg-primary/12 text-primary"
                : "border-card-border text-muted hover:border-primary/45 hover:text-foreground"
            )}
          >
            {e.titulo}
          </button>
        ))}
      </div>

      {/* ——— Enunciado + restrições ——— */}
      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">{escolhida.titulo}</h2>
        <blockquote className="mt-3 border-l-2 border-primary/50 pl-3.5 text-[15px] leading-relaxed">
          {escolhida.enunciado}
        </blockquote>
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            Restrições
          </p>
          <ul className="mt-2 space-y-1.5">
            {escolhida.restricoes.map((r, i) => (
              <li key={i} className="flex gap-2 text-[14px] leading-relaxed">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60"
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ——— A rubrica, escondida até você desenhar ———
          Revelar de imediato viraria leitura passiva; o valor está em pensar
          o desenho primeiro e só então se corrigir. ——— */}
      {!revelada ? (
        <div className="rounded-2xl border border-dashed border-card-border p-6 text-center">
          <p className="text-sm text-muted">
            Esboce o desenho no papel ou na cabeça antes de abrir a rubrica.
          </p>
          <button
            type="button"
            onClick={() => setRevelada(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            <ClipboardCheck className="size-4" />
            Ver a rubrica
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {NIVEL_ORDEM.map((nivel) => {
            const itens = escolhida.rubrica.filter((r) => r.nivel === nivel);
            if (itens.length === 0) return null;
            return (
              <section
                key={nivel}
                className="rounded-2xl border border-card-border bg-card p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{
                      color: NIVEL_COR[nivel],
                      background: `color-mix(in srgb, ${NIVEL_COR[nivel]} 12%, transparent)`,
                    }}
                  >
                    {NIVEL_ROTULO[nivel]}
                  </span>
                  <span className="text-[12px] text-muted">
                    {NIVEL_LEGENDA[nivel]}
                  </span>
                </div>
                <ul className="mt-3 space-y-3.5">
                  {itens.map((item, i) => (
                    <li
                      key={i}
                      className="border-t border-card-border pt-3.5 first:border-0 first:pt-0"
                    >
                      <p className="text-[14px] font-semibold leading-snug">
                        {item.ponto}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted">
                        {item.porque}
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {item.conceitos.map((slug) => {
                          const c = getConceito(slug);
                          if (!c) return null;
                          return (
                            <li key={slug}>
                              <Link
                                href={`/conceitos/${slug}`}
                                className="inline-flex items-center gap-1 rounded-md border border-card-border px-2 py-0.5 text-[12px] font-medium transition-colors hover:border-primary/60 hover:text-primary"
                              >
                                {c.titulo}
                                <ArrowUpRight className="size-3 opacity-60" />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          {/* ——— A armadilha ——— */}
          <section
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              borderColor: "color-mix(in srgb, var(--perigo) 40%, transparent)",
              background: "color-mix(in srgb, var(--perigo) 8%, transparent)",
            }}
          >
            <h3
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--perigo)" }}
            >
              <AlertTriangle className="size-3.5" />
              A armadilha
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed">
              {escolhida.pegadinha}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
