"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bug,
  CheckCircle2,
  ChevronRight,
  XCircle,
} from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { getConceito } from "@/shared/lib/content";
import { alternativasDoCaso, type CasoClinica } from "@/shared/lib/clinica";
import { CATEGORIAS } from "@/shared/config/categorias";
import { cn } from "@/shared/utils/cn";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";

export type CasoClinicaComHtml = CasoClinica & { html: string };

/**
 * Um trecho quebrado por vez: nomeie o conceito, veja o efeito e a correção.
 */
export function ClinicaSessao({
  casos,
  semente,
}: {
  casos: CasoClinicaComHtml[];
  semente: number;
}) {
  const [indice, setIndice] = useState(0);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [respondidos, setRespondidos] = useState(0);

  const caso = casos[indice];
  const alternativas = useMemo(
    () => (caso ? alternativasDoCaso(caso, semente + indice * 17) : []),
    [caso, semente, indice]
  );

  if (!caso || casos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-card-border p-5 text-center text-sm text-muted">
        Ainda não há trechos com código para esta sessão.
      </p>
    );
  }

  const revelado = escolha !== null;
  const acertou = escolha === caso.slug;
  const cat = CATEGORIAS[getConceito(caso.slug)?.categoria ?? "principio"];

  const responder = (slug: string) => {
    if (escolha) return;
    setEscolha(slug);
    setRespondidos((n) => n + 1);
    if (slug === caso.slug) setAcertos((n) => n + 1);
  };

  const proximo = () => {
    setEscolha(null);
    setIndice((i) => (i + 1) % casos.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Bug className="size-3.5" />
          Trecho {indice + 1} de {casos.length}
        </span>
        {respondidos > 0 && (
          <span className="font-mono tabular-nums">
            {acertos}/{respondidos} acertos
          </span>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-card-border bg-card">
          <div className="border-b border-card-border px-4 py-3 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              O problema
            </p>
            <p className="mt-1 text-[15px] font-medium leading-snug text-foreground">
              {caso.problema}
            </p>
          </div>
          <div
            className="max-w-full overflow-x-auto overscroll-x-contain [&_.shiki]:!m-0 [&_.shiki]:!rounded-none [&_.shiki]:!border-0 [&_.shiki]:text-[12px] sm:[&_.shiki]:text-[13px]"
            dangerouslySetInnerHTML={{ __html: caso.html }}
          />
        </section>

        <aside className="space-y-3 lg:sticky lg:top-4">
          <h2 className="text-sm font-semibold tracking-tight">
            Qual conceito foi mal aplicado?
          </h2>
          <ul className="flex flex-col gap-2">
            {alternativas.map((slug) => {
              const c = getConceito(slug);
              if (!c) return null;
              const correta = slug === caso.slug;
              const marcada = escolha === slug;
              return (
                <li key={slug}>
                  <button
                    type="button"
                    disabled={revelado}
                    onClick={() => responder(slug)}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-2 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-colors",
                      !revelado &&
                        "border-card-border bg-card hover:border-primary/45",
                      revelado &&
                        correta &&
                        "border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-[color-mix(in_srgb,var(--ok)_10%,transparent)]",
                      revelado &&
                        marcada &&
                        !correta &&
                        "border-[color-mix(in_srgb,var(--perigo)_45%,transparent)] bg-[color-mix(in_srgb,var(--perigo)_10%,transparent)]",
                      revelado &&
                        !marcada &&
                        !correta &&
                        "border-card-border opacity-50"
                    )}
                  >
                    {revelado && correta && (
                      <CheckCircle2
                        className="size-4 shrink-0"
                        style={{ color: "var(--ok)" }}
                      />
                    )}
                    {revelado && marcada && !correta && (
                      <XCircle
                        className="size-4 shrink-0"
                        style={{ color: "var(--perigo)" }}
                      />
                    )}
                    <span className="min-w-0 leading-snug">{c.titulo}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      {revelado && (
        <section className="space-y-3 rounded-2xl border border-card-border bg-card p-4 sm:p-5">
          <p
            className={cn(
              "text-sm font-semibold",
              acertou ? "text-[var(--ok)]" : "text-[var(--perigo)]"
            )}
          >
            {acertou
              ? `Isso. Este trecho é ${caso.titulo} feito do jeito errado.`
              : `Era ${caso.titulo}. O conceito certo, aplicado torto.`}
          </p>

          {caso.sintomas.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                O que quebra
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {caso.sintomas.map((s) => (
                  <li
                    key={s.quando}
                    className="text-[13px] leading-relaxed text-muted"
                  >
                    <span className="font-medium text-foreground">
                      {s.quando}:
                    </span>{" "}
                    {s.efeito}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Correção
            </p>
            <p className="mt-1 text-[14px] leading-relaxed">
              <TextoRico>{caso.correcao}</TextoRico>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={`/conceitos/${caso.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
              style={{ ["--acento" as string]: cat.cssVar }}
            >
              Ler {caso.titulo}
              <ArrowUpRight className="size-3.5" />
            </Link>
            <Button size="lg" variant="outline" onClick={proximo}>
              Próximo trecho
              <ChevronRight />
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
