"use client";

import { useState } from "react";
import { ArrowRight, Plus, Minus, Check, TriangleAlert, Sparkles } from "lucide-react";
import { TEMPLATES } from "@/content/construtor/regras";
import {
  compararProjetos,
  resumoDoDiff,
  type DiffMetrica,
} from "@/shared/lib/comparar-projetos";
import { cn } from "@/shared/utils/cn";

/**
 * Comparador de projetos.
 *
 * Responde "e se eu tirasse a fila?", que não dá para responder de cabeça:
 * as cinco métricas se movem juntas e o ganho de uma esconde a piora de outra.
 *
 * Todo o cálculo vem de `lib/comparar-projetos.ts`, puro e testado.
 */

/** Barra de uma métrica, com o delta assinado e o veredito já resolvido. */
function LinhaMetrica({ m }: { m: DiffMetrica }) {
  const cor =
    m.veredito === "melhor"
      ? "var(--ok)"
      : m.veredito === "pior"
        ? "var(--perigo)"
        : "var(--muted)";

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-medium">{m.label}</span>
          <span className="font-mono text-[11px] text-muted">
            {m.a} → {m.b}
          </span>
        </div>
        {/* duas barras sobrepostas: a referência em cinza, a variante em cor */}
        <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-full bg-muted/40"
            style={{ width: `${Math.min(100, m.a)}%` }}
          />
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${Math.min(100, m.b)}%`, background: cor, opacity: 0.75 }}
          />
        </div>
      </div>
      <span
        className="w-14 text-right font-mono text-[13px] font-bold"
        style={{ color: cor }}
      >
        {m.delta === 0 ? "=" : m.delta > 0 ? `+${m.delta}` : m.delta}
      </span>
    </li>
  );
}

export function ComparadorProjetos() {
  const [idA, setIdA] = useState("crud");
  const [idB, setIdB] = useState("ecommerce-cqrs");

  const a = TEMPLATES.find((t) => t.id === idA)!;
  const b = TEMPLATES.find((t) => t.id === idB)!;
  const diff = compararProjetos(a.estado, b.estado);

  return (
    <div className="space-y-6">
      {/* escolha dos dois lados */}
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {(
          [
            ["Referência", idA, setIdA],
            ["Variante", idB, setIdB],
          ] as const
        ).map(([rotulo, valor, set], i) => (
          <div key={rotulo} className={i === 1 ? "sm:order-3" : undefined}>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {rotulo}
            </span>
            <select
              value={valor}
              onChange={(e) => set(e.target.value)}
              className="mt-1 w-full rounded-lg border border-card-border bg-background px-2.5 py-2 text-[14px]"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
        ))}
        <ArrowRight
          aria-hidden
          className="mx-auto hidden size-5 shrink-0 text-muted sm:order-2 sm:block"
        />
      </div>

      <p className="rounded-2xl border border-card-border bg-card p-4 text-[15px] leading-relaxed sm:p-5">
        {resumoDoDiff(diff)}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* métricas */}
        <section
          aria-labelledby="metricas"
          className="rounded-2xl border border-card-border bg-card p-4 sm:p-5"
        >
          <h2 id="metricas" className="text-sm font-semibold tracking-tight">
            As cinco métricas
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Cinza é a referência; a cor é a variante. Em complexidade e custo,
            menor é melhor (o sinal já está invertido).
          </p>
          <ul className="mt-3 divide-y divide-card-border">
            {diff.metricas.map((m) => (
              <LinhaMetrica key={m.chave} m={m} />
            ))}
          </ul>
        </section>

        {/* peças */}
        <section
          aria-labelledby="pecas"
          className="rounded-2xl border border-card-border bg-card p-4 sm:p-5"
        >
          <h2 id="pecas" className="text-sm font-semibold tracking-tight">
            O que muda de peça
          </h2>

          {diff.soEmB.length === 0 && diff.soEmA.length === 0 ? (
            <p className="mt-2 text-[13px] text-muted">
              As duas pilhas têm exatamente as mesmas peças.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {diff.soEmB.map((p) => (
                <li
                  key={`b-${p.label}-${p.onde ?? ""}`}
                  className="flex items-start gap-2 text-[13px]"
                >
                  <Plus
                    aria-hidden
                    className="mt-0.5 size-3.5 shrink-0"
                    style={{ color: "var(--ok)" }}
                  />
                  <span>
                    {p.label}
                    {p.onde && <span className="text-muted"> · {p.onde}</span>}
                  </span>
                </li>
              ))}
              {diff.soEmA.map((p) => (
                <li
                  key={`a-${p.label}-${p.onde ?? ""}`}
                  className="flex items-start gap-2 text-[13px]"
                >
                  <Minus
                    aria-hidden
                    className="mt-0.5 size-3.5 shrink-0"
                    style={{ color: "var(--perigo)" }}
                  />
                  <span className="text-muted">
                    {p.label}
                    {p.onde && <span> · {p.onde}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* o que o motor diz que mudou */}
      {(diff.alertasResolvidos.length > 0 ||
        diff.alertasNovos.length > 0 ||
        diff.sinergiasGanhas.length > 0) && (
        <section
          aria-labelledby="insights"
          className="rounded-2xl border border-card-border bg-card p-4 sm:p-5"
        >
          <h2 id="insights" className="text-sm font-semibold tracking-tight">
            O que o motor de regras diz
          </h2>
          <ul className="mt-3 space-y-2">
            {diff.alertasResolvidos.map((i) => (
              <li key={`r-${i.id}`} className="flex items-start gap-2 text-[14px]">
                <Check
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: "var(--ok)" }}
                />
                <span>
                  <span className="font-semibold">Resolvido: </span>
                  {i.titulo}
                </span>
              </li>
            ))}
            {diff.sinergiasGanhas.map((i) => (
              <li key={`s-${i.id}`} className="flex items-start gap-2 text-[14px]">
                <Sparkles
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: "var(--acento)" }}
                />
                <span>
                  <span className="font-semibold">Sinergia nova: </span>
                  {i.titulo}
                </span>
              </li>
            ))}
            {diff.alertasNovos.map((i) => (
              <li key={`n-${i.id}`} className="flex items-start gap-2 text-[14px]">
                <TriangleAlert
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: "var(--perigo)" }}
                />
                <span>
                  <span className="font-semibold">Introduzido: </span>
                  {i.titulo}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div
        className={cn(
          "rounded-xl border p-3.5 text-[13px] leading-relaxed",
          "border-card-border text-muted"
        )}
      >
        <span className="font-semibold text-foreground">Nota: </span>
        as cinco métricas medem propriedades do desenho, não do time. Uma
        variante que ganha em resiliência e perde em custo operacional está
        pedindo gente para operar, e isso não aparece em nenhuma barra acima.
      </div>
    </div>
  );
}
