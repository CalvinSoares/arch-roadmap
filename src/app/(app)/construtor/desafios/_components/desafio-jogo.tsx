"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, Layers, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { camadaDef, padraoDef } from "@/content/construtor/blocos";
import { TECNOLOGIAS_DEF } from "@/content/construtor/tecnologias";
import { alternativasDoDesafio, corrigir } from "@/shared/lib/desafios";
import type { Desafio } from "@/content/construtor/desafios";
import { cn } from "@/shared/utils/cn";

const techNome = (id: string) =>
  TECNOLOGIAS_DEF.find((t) => t.id === id)?.nome ?? id;

/** A pilha montada, só de leitura; é o que o usuário investiga. */
function Pilha({ desafio }: { desafio: Desafio }) {
  return (
    <ol className="space-y-1.5">
      {desafio.estado.camadas.map((c, i) => {
        const def = camadaDef(c.camadaId);
        return (
          <li
            key={`${c.camadaId}-${i}`}
            className="rounded-xl border border-card-border bg-card p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-muted">{i + 1}</span>
              <span className="text-sm font-semibold">{def?.nome ?? c.camadaId}</span>
              {c.padroes.map((p) => (
                <span
                  key={p}
                  className="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                  style={{
                    color: "var(--cat-comportamental)",
                    background:
                      "color-mix(in srgb, var(--cat-comportamental) 12%, transparent)",
                  }}
                >
                  {padraoDef(p)?.nome ?? p}
                </span>
              ))}
              {c.tecnologias.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-card-border px-1.5 py-0.5 font-mono text-[11px] text-muted"
                >
                  {techNome(t)}
                </span>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function DesafioJogo({ desafios }: { desafios: Desafio[] }) {
  const [indice, setIndice] = useState(0);
  const [escolhas, setEscolhas] = useState<string[]>([]);
  const [enviado, setEnviado] = useState(false);

  const desafio = desafios[indice];
  // semente do índice: mesma ordem de alternativas para todo mundo
  const alternativas = alternativasDoDesafio(desafio, indice + 1);
  const correcao = enviado ? corrigir(desafio, escolhas) : null;

  const alternar = (id: string) =>
    setEscolhas((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]
    );

  const irPara = (i: number) => {
    setIndice(i);
    setEscolhas([]);
    setEnviado(false);
  };

  return (
    <div className="space-y-6">
      {/* seletor de desafio */}
      <div className="flex flex-wrap gap-1.5">
        {desafios.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => irPara(i)}
            aria-current={i === indice ? "true" : undefined}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              i === indice
                ? "border-primary/50 bg-primary/12 text-primary"
                : "border-card-border text-muted hover:text-foreground"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          O cenário
        </p>
        <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-foreground">
          <TextoRico>{desafio.contexto}</TextoRico>
        </p>

        <div className="mt-5 flex items-center gap-2">
          <Layers aria-hidden className="size-4 text-muted" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            A arquitetura montada
          </p>
        </div>
        <div className="mt-2.5">
          <Pilha desafio={desafio} />
        </div>
      </section>

      <section
        aria-labelledby="o-que-esta-errado"
        className="rounded-2xl border border-card-border bg-card p-5 sm:p-6"
      >
        <h2 id="o-que-esta-errado" className="text-lg font-semibold tracking-[-0.02em]">
          O que está errado aqui?
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Marque tudo que se aplica. Apontar defeito onde não há também conta.
        </p>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {alternativas.map((a) => {
            const marcada = escolhas.includes(a.id);
            const acertou = enviado && a.correta && marcada;
            const errou = enviado && !a.correta && marcada;
            const perdeu = enviado && a.correta && !marcada;

            return (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={enviado}
                  onClick={() => alternar(a.id)}
                  aria-pressed={marcada}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-[14px] transition-colors",
                    !enviado && marcada && "border-primary/50 bg-primary/8",
                    !enviado && !marcada && "border-card-border hover:border-primary/30",
                    acertou && "border-[var(--ok)]/60 bg-[color-mix(in_srgb,var(--ok)_10%,transparent)]",
                    errou && "border-[var(--perigo)]/60 bg-[color-mix(in_srgb,var(--perigo)_10%,transparent)]",
                    perdeu && "border-[var(--alerta)]/60 bg-[color-mix(in_srgb,var(--alerta)_10%,transparent)]",
                    enviado && !marcada && !a.correta && "border-card-border opacity-50"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 grid size-4 shrink-0 place-items-center rounded border",
                      marcada ? "border-transparent bg-primary text-primary-foreground" : "border-card-border"
                    )}
                  >
                    {marcada && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0">{a.titulo}</span>
                  {enviado && (
                    <span aria-hidden className="ml-auto shrink-0">
                      {acertou && <Check className="size-4 text-[var(--ok)]" />}
                      {errou && <X className="size-4 text-[var(--perigo)]" />}
                      {perdeu && <ArrowRight className="size-4 text-[var(--alerta)]" />}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {!enviado ? (
          <Button
            className="mt-5"
            onClick={() => setEnviado(true)}
            disabled={escolhas.length === 0}
          >
            Conferir
          </Button>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold">
                {correcao!.acertos.length} de {desafio.esperadas.length} defeito(s)
              </span>
              {correcao!.falsosPositivos.length > 0 && (
                <span style={{ color: "var(--perigo)" }}>
                  {correcao!.falsosPositivos.length} apontado(s) a mais
                </span>
              )}
              {correcao!.perdidos.length > 0 && (
                <span style={{ color: "var(--alerta)" }}>
                  {correcao!.perdidos.length} passou(aram) despercebido(s)
                </span>
              )}
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: "color-mix(in srgb, var(--ok) 30%, transparent)",
                background: "color-mix(in srgb, var(--ok) 5%, transparent)",
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                O veredito
              </p>
              <p className="mt-1.5 max-w-[68ch] text-[14px] leading-relaxed text-foreground">
                <TextoRico>{desafio.veredito}</TextoRico>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => irPara(indice)}>
                <RotateCcw className="size-4" />
                Tentar de novo
              </Button>
              {indice < desafios.length - 1 && (
                <Button onClick={() => irPara(indice + 1)}>
                  Próximo desafio
                  <ArrowRight className="size-4" />
                </Button>
              )}
              <Button variant="ghost" asChild>
                <Link href="/construtor">Ir para o Construtor</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
