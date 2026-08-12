"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Cpu } from "lucide-react";
import { escalaCompleta, formatarLatencia } from "@/content/latencias";
import {
  posicao,
  decadas,
  razao,
  formatarRazao,
  type Transformacao,
} from "@/shared/lib/escala";
import { cn } from "@/shared/utils/cn";

const PONTOS = escalaCompleta();
const MIN = PONTOS[0].ms;
const MAX = PONTOS[PONTOS.length - 1].ms;

const PRESETS: { id: string; rotulo: string; a: string; b: string }[] = [
  { id: "ram-regiao", rotulo: "RAM × Virgínia", a: "ram", b: "rtt-regiao" },
  {
    id: "cache-scan",
    rotulo: "Cache × full scan",
    a: "memoria",
    b: "bancoScan",
  },
  {
    id: "disjuntor-espera",
    rotulo: "Disjuntor × sem prazo",
    a: "falhaRapida",
    b: "esperaSemPrazo",
  },
];

type FaixaGrandeza = "ns" | "µs" | "ms" | "s";

function faixaDe(ms: number): FaixaGrandeza {
  // Alinhado às faixas de formatarLatencia (0,5ms fica em ms, não em µs).
  if (ms < 0.001) return "ns";
  if (ms < 0.1) return "µs";
  if (ms < 1000) return "ms";
  return "s";
}

const ORDEM_FAIXA: FaixaGrandeza[] = ["ns", "µs", "ms", "s"];
const ROTULO_FAIXA: Record<FaixaGrandeza, string> = {
  ns: "Nanossegundos",
  "µs": "Microssegundos",
  ms: "Milissegundos",
  s: "Segundos",
};

/**
 * Escala de latência — uma job: sentir a proporção entre dois tempos.
 *
 * O eixo é esparso (dots + rótulos só do par selecionado). O inventário
 * legível fica na lista por ordem de grandeza. Log × linear continua sendo
 * a lição visual do colapso sub-ms.
 */
export function EscalaPlayground() {
  const [transformacao, setTransformacao] = useState<Transformacao>("log");
  const [a, setA] = useState("ram");
  const [b, setB] = useState("rtt-regiao");

  const grade = transformacao === "log" ? decadas(MIN, MAX) : [];

  const pa = PONTOS.find((p) => p.id === a) ?? PONTOS[0];
  const pb = PONTOS.find((p) => p.id === b) ?? PONTOS[PONTOS.length - 1];
  const rapido = pa.ms <= pb.ms ? pa : pb;
  const lento = pa.ms <= pb.ms ? pb : pa;
  const mesmo = rapido.id === lento.id;

  const presetAtivo = PRESETS.find((p) => p.a === a && p.b === b)?.id;

  const porFaixa = useMemo(() => {
    const map = new Map<FaixaGrandeza, typeof PONTOS>();
    for (const f of ORDEM_FAIXA) map.set(f, []);
    for (const p of PONTOS) {
      map.get(faixaDe(p.ms))!.push(p);
    }
    return ORDEM_FAIXA.map((f) => ({
      faixa: f,
      itens: map.get(f)!,
    })).filter((g) => g.itens.length > 0);
  }, []);

  const escolher = (id: string) => {
    const p = PONTOS.find((x) => x.id === id);
    if (!p) return;
    // mesma regra de antes: mais lento que A → B; mais rápido → A
    if (pa.ms <= p.ms) setB(id);
    else setA(id);
  };

  const aplicarPreset = (preset: (typeof PRESETS)[number]) => {
    setA(preset.a);
    setB(preset.b);
  };

  return (
    <div className="space-y-8">
      {/* ——— Hero: comparador ——— */}
      <section
        aria-labelledby="comparar"
        className="rounded-2xl border border-card-border bg-card p-5 sm:p-6"
      >
        <div className="flex items-center gap-2.5">
          <ArrowLeftRight aria-hidden className="size-4 text-[var(--acento)]" />
          <h2 id="comparar" className="text-sm font-semibold tracking-tight">
            Quantas vezes cabe?
          </h2>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => aplicarPreset(p)}
              aria-pressed={presetAtivo === p.id}
              className={cn(
                "min-h-10 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                presetAtivo === p.id
                  ? "border-primary/50 bg-primary/12 text-primary"
                  : "border-card-border text-muted hover:text-foreground"
              )}
            >
              {p.rotulo}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["a", a, setA, "Primeiro"],
              ["b", b, setB, "Segundo"],
            ] as const
          ).map(([lado, valor, set, etiqueta]) => (
            <label key={lado} className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {etiqueta}
              </span>
              <select
                value={valor}
                onChange={(e) => set(e.target.value)}
                className="mt-1 w-full max-w-full rounded-lg border border-card-border bg-background px-2.5 py-2.5 text-[13px]"
              >
                {PONTOS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.rotulo} — {formatarLatencia(p.ms)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        {mesmo ? (
          <p className="mt-5 text-[14px] text-muted">
            Escolha dois pontos diferentes para ver a proporção.
          </p>
        ) : (
          <p className="mt-5 text-[15px] leading-relaxed sm:text-base">
            <span className="font-semibold">{lento.rotulo}</span> é{" "}
            <span
              className="font-mono text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ color: "var(--primary)" }}
            >
              {formatarRazao(razao(rapido.ms, lento.ms))}
            </span>{" "}
            mais lento que{" "}
            <span className="font-semibold">{rapido.rotulo}</span>.
          </p>
        )}

        <p className="mt-4 flex items-start gap-2 border-t border-card-border pt-3 text-[13px] leading-relaxed text-muted">
          <Cpu aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Se o ciclo de CPU durasse um segundo, a ida e volta até a Virgínia
            levaria mais de{" "}
            <span className="font-semibold text-foreground">doze anos</span>.
            É essa a distância que uma chamada de rede atravessa, e a razão de
            todo pedido precisar de prazo.
          </span>
        </p>
      </section>

      {/* ——— Eixo esparso ——— */}
      <section aria-labelledby="eixo-titulo" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="eixo-titulo"
              className="text-sm font-semibold tracking-tight"
            >
              Na régua
            </h2>
            <p className="mt-0.5 text-[13px] text-muted">
              Clique num ponto para comparar. Só o par escolhido leva rótulo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["log", "linear"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTransformacao(t)}
                aria-pressed={t === transformacao}
                className={cn(
                  "min-h-10 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  t === transformacao
                    ? "border-primary/50 bg-primary/12 text-primary"
                    : "border-card-border text-muted hover:text-foreground"
                )}
              >
                {t === "log" ? "Logarítmica" : "Real (linear)"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[13px] text-muted">
          {transformacao === "log"
            ? "Cada linha de grade é 10× a anterior. É o único jeito de tudo caber."
            : "Escala real: tudo abaixo de 1ms some na origem. Essa é a proporção de verdade."}
        </p>

        <div className="overflow-x-auto rounded-2xl border border-card-border bg-card p-3 sm:p-6">
          <div
            className="relative mx-auto h-32 min-w-[18rem] px-3 sm:h-32 sm:px-4"
            role="img"
            aria-label={`Escala de latência ${transformacao === "log" ? "logarítmica" : "linear"}, de ${formatarLatencia(MIN)} a ${formatarLatencia(MAX)}. Selecionados: ${pa.rotulo} e ${pb.rotulo}.`}
          >
            {grade.map((d) => {
              const x = posicao(d, MIN, MAX, transformacao) * 100;
              return (
                <div
                  key={d}
                  aria-hidden
                  className="absolute bottom-7 top-0 border-l border-dashed border-card-border/80"
                  style={{ left: `${x}%` }}
                >
                  <span className="absolute -bottom-5 left-1 whitespace-nowrap font-mono text-[10px] text-muted">
                    {formatarLatencia(d)}
                  </span>
                </div>
              );
            })}

            <div
              aria-hidden
              className="absolute bottom-7 left-0 right-0 h-px bg-card-border"
            />

            {/* rótulos só do par — acima dos dots, em duas alturas se ambos selecionados */}
            {[pa, pb]
              .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
              .map((p, i) => {
                const x = posicao(p.ms, MIN, MAX, transformacao) * 100;
                const cor = p.doSimulador
                  ? "var(--primary)"
                  : "var(--cat-dados)";
                const acima = i === 0;
                return (
                  <div
                    key={`label-${p.id}`}
                    className="pointer-events-none absolute z-10 max-w-[9rem] -translate-x-1/2 sm:max-w-[11rem]"
                    style={{
                      left: `${x}%`,
                      bottom: acima ? "4.25rem" : "2.85rem",
                    }}
                  >
                    <span
                      className="block truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight text-foreground"
                      style={{
                        borderColor: cor,
                        background: `color-mix(in srgb, ${cor} 14%, transparent)`,
                      }}
                    >
                      <span className="font-mono">{formatarLatencia(p.ms)}</span>{" "}
                      {p.rotulo}
                    </span>
                  </div>
                );
              })}

            {PONTOS.map((p) => {
              const x = posicao(p.ms, MIN, MAX, transformacao) * 100;
              const destacado = p.id === a || p.id === b;
              const cor = p.doSimulador
                ? "var(--primary)"
                : "var(--cat-dados)";

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => escolher(p.id)}
                  title={`${p.rotulo} — ${formatarLatencia(p.ms)}`}
                  aria-label={`${p.rotulo}, ${formatarLatencia(p.ms)}${destacado ? ", selecionado" : ""}`}
                  aria-pressed={destacado}
                  className={cn(
                    // hit area ≥40px; visual do dot fica no centro
                    "absolute bottom-7 z-[1] flex size-10 -translate-x-1/2 translate-y-1/2 items-center justify-center",
                    "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                  style={{ left: `${x}%` }}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "rounded-full border-2 transition-transform",
                      destacado ? "size-3.5" : "size-2.5 opacity-80"
                    )}
                    style={{
                      background: cor,
                      borderColor: destacado ? "var(--card)" : cor,
                      boxShadow: destacado ? `0 0 0 2px ${cor}` : undefined,
                    }}
                  />
                </button>
              );
            })}
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ background: "var(--primary)" }}
              />
              usado pelo simulador do Construtor
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ background: "var(--cat-dados)" }}
              />
              referência de hardware e rede
            </span>
          </p>
        </div>
      </section>

      {/* ——— Inventário por ordem de grandeza ——— */}
      <section aria-labelledby="inventario" className="space-y-3">
        <div>
          <h2 id="inventario" className="text-sm font-semibold tracking-tight">
            Todos os pontos
          </h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Por ordem de grandeza. Clique para colocar no comparador.
          </p>
        </div>

        <div className="space-y-4">
          {porFaixa.map(({ faixa, itens }) => (
            <div key={faixa}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                {ROTULO_FAIXA[faixa]}
              </p>
              <ul className="divide-y divide-card-border overflow-hidden rounded-xl border border-card-border bg-card">
                {itens.map((p) => {
                  const ativo = p.id === a || p.id === b;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => escolher(p.id)}
                        className={cn(
                          "flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-[13px] transition-colors hover:bg-foreground/[0.03]",
                          ativo && "bg-primary/8"
                        )}
                      >
                        <span className="min-w-0">
                          <span
                            aria-hidden
                            className="mr-2 inline-block size-1.5 translate-y-[-1px] rounded-full"
                            style={{
                              background: p.doSimulador
                                ? "var(--primary)"
                                : "var(--cat-dados)",
                            }}
                          />
                          <span
                            className={cn(
                              "font-medium",
                              ativo ? "text-foreground" : "text-foreground/90"
                            )}
                          >
                            {p.rotulo}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[12px] tabular-nums text-muted">
                          {formatarLatencia(p.ms)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
