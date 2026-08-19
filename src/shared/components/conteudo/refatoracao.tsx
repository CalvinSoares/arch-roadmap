"use client";

import { useState } from "react";
import { Wind, ArrowRight, Check } from "lucide-react";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { cn } from "@/shared/utils/cn";

interface EtapaDestacada {
  titulo: string;
  motivo: string;
  html: string;
}

interface Props {
  titulo?: string;
  cheiro: string;
  /** Etapa 0 é o ponto de partida; as seguintes são os passos. */
  etapas: EtapaDestacada[];
  veredito: string;
}

/**
 * Refatoração passo a passo.
 *
 * Cliente por causa do controle de etapa. O highlight de cada etapa já vem
 * pronto do servidor; o componente só troca qual HTML está visível, o que
 * mantém o custo de interação em zero.
 *
 * A trilha de passos é vertical de propósito: refatoração é uma sequência com
 * ordem, e uma lista horizontal sugeriria que dá para pular.
 */
export function Refatoracao({ titulo, cheiro, etapas, veredito }: Props) {
  const [atual, setAtual] = useState(0);
  const etapa = etapas[atual];
  const ultima = atual === etapas.length - 1;

  return (
    <section
      // O id fica na seção, não no título: é ele que a trilha de leitura
      // observa para marcar a posição.
      id="refatoracao"
      aria-labelledby="refatoracao-titulo"
      className="scroll-mt-24"
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-lg"
          style={{
            background: "color-mix(in srgb, var(--acento) 14%, transparent)",
            color: "var(--acento)",
          }}
        >
          <Wind className="size-4" />
        </span>
        <div className="min-w-0">
          <h2
            id="refatoracao-titulo"
            className="text-lg font-semibold tracking-[-0.02em]"
          >
            {titulo ?? "Do cheiro ao padrão"}
          </h2>
          <p className="text-[13px] text-muted">
            Um passo por vez, com o motivo de cada um.
          </p>
        </div>
      </div>

      <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-foreground">
        <span className="font-semibold">O cheiro: </span>
        <TextoRico>{cheiro}</TextoRico>
      </p>

      {/* trilha de passos */}
      <ol className="mt-4 flex flex-wrap gap-1.5">
        {etapas.map((e, i) => (
          <li key={e.titulo}>
            <button
              type="button"
              onClick={() => setAtual(i)}
              aria-current={i === atual ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                i === atual
                  ? "border-[var(--acento)]/50 bg-[color-mix(in_srgb,var(--acento)_12%,transparent)] text-[var(--acento)]"
                  : i < atual
                    ? "border-card-border text-muted hover:text-foreground"
                    : "border-card-border text-muted/70 hover:text-foreground"
              )}
            >
              <span aria-hidden className="font-mono text-[10px]">
                {i === 0 ? "0" : i}
              </span>
              {e.titulo}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-2xl border border-card-border bg-card p-4 sm:p-5">
        <p className="flex items-start gap-2 text-[14px] leading-relaxed">
          {atual === 0 ? (
            <Wind
              aria-hidden
              className="mt-0.5 size-4 shrink-0"
              style={{ color: "var(--alerta)" }}
            />
          ) : (
            <ArrowRight
              aria-hidden
              className="mt-0.5 size-4 shrink-0"
              style={{ color: "var(--acento)" }}
            />
          )}
          <span>
            <span className="font-semibold">{etapa.titulo}. </span>
            <TextoRico>{etapa.motivo}</TextoRico>
          </span>
        </p>

        <div
          className="mt-3 overflow-x-auto text-[13px]"
          dangerouslySetInnerHTML={{ __html: etapa.html }}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {atual > 0 && (
            <button
              type="button"
              onClick={() => setAtual((a) => a - 1)}
              className="rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              Passo anterior
            </button>
          )}
          {!ultima && (
            <button
              type="button"
              onClick={() => setAtual((a) => a + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--acento)]/45 bg-[color-mix(in_srgb,var(--acento)_10%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--acento)] transition-colors hover:bg-[color-mix(in_srgb,var(--acento)_16%,transparent)]"
            >
              Próximo passo
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {ultima && (
        <p
          className="mt-3 flex items-start gap-2 rounded-xl border p-3.5 text-[14px] leading-relaxed"
          style={{
            borderColor: "color-mix(in srgb, var(--ok) 30%, transparent)",
            background: "color-mix(in srgb, var(--ok) 5%, transparent)",
          }}
        >
          <Check
            aria-hidden
            className="mt-0.5 size-4 shrink-0"
            style={{ color: "var(--ok)" }}
          />
          <span>
            <span className="font-semibold">O saldo: </span>
            <TextoRico>{veredito}</TextoRico>
          </span>
        </p>
      )}
    </section>
  );
}
