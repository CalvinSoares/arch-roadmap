"use client";

import { useMemo, useState } from "react";
import { TriangleAlert, CheckCircle2, XCircle } from "lucide-react";
import {
  montarSimulacao,
  SEM_FALHAS,
  type Falhas,
} from "@/app/(app)/construtor/utils/simulador";
import { formatarLatencia } from "@/content/latencias";
import { formatarRazao, razao } from "@/shared/lib/escala";
import type { CamadaId, EstadoProjeto } from "@/shared/types/construtor";
import { cn } from "@/shared/utils/cn";

type Variante = "cache" | "timeout";

const camada = (
  camadaId: CamadaId,
  padroes: string[] = [],
  tecnologias: string[] = []
) => ({ camadaId, padroes, tecnologias });

function estadoBase(padroesApi: string[] = []): EstadoProjeto {
  return {
    camadas: [
      camada("api", padroesApi, ["nginx"]),
      camada("aplicacao", [], []),
      camada("dominio", [], []),
      camada("write-store", [], ["postgres"]),
      camada("read-store", [], ["redis"]),
    ],
  };
}

const RESULTADO_VISUAL = {
  ok: { label: "ok", icon: CheckCircle2, cor: "var(--ok)" },
  degradado: { label: "degradado", icon: TriangleAlert, cor: "var(--alerta)" },
  erro: { label: "erro", icon: XCircle, cor: "var(--perigo)" },
} as const;

const PROTECOES = [
  { id: "timeout", rotulo: "Timeout" },
  { id: "retry", rotulo: "Retry" },
  { id: "circuit-breaker", rotulo: "Disjuntor" },
] as const;

function leituraDaSessao(
  variante: Variante,
  falhas: Falhas,
  protecoes: Set<string>
): string {
  if (variante === "cache") {
    if (!falhas.cache && !falhas.banco) {
      return "Tudo no ar: hit no Redis, Postgres nem é chamado.";
    }
    if (falhas.cache && !falhas.banco) {
      return "Redis caiu. Toda leitura vai no banco. Sem cache, o miss vira enxurrada.";
    }
    if (!falhas.cache && falhas.banco) {
      return "Banco fora, mas o hit ainda responde. Quando a chave expirar, o miss vira incidente.";
    }
    return "Redis e banco fora. Não tem de onde ler. Falta isolamento; cache sozinho não resolve.";
  }
  if (protecoes.has("circuit-breaker")) {
    return "Disjuntor aberto. A borda recusa na hora e a thread não fica presa.";
  }
  if (protecoes.has("timeout") && protecoes.has("retry")) {
    return "Timeout com retry. Cada tentativa tem prazo, mas três tentativas somam o custo.";
  }
  if (protecoes.has("timeout")) {
    return "Com prazo a chamada aborta em segundos, em vez de segurar a thread até o cliente desistir.";
  }
  return "Sem prazo. A dependência trava e você segura a thread uns 30 segundos.";
}

/**
 * Laboratório: injete a falha → acrescente proteção → sinta o custo mudar.
 * Reusa `montarSimulacao`, a mesma matemática do Construtor.
 */
export function FalhaPlayground({ variante }: { variante: Variante }) {
  const [redisDown, setRedisDown] = useState(false);
  const [bancoDown, setBancoDown] = useState(variante === "timeout");
  const [protecoes, setProtecoes] = useState<Set<string>>(new Set());

  const falhas: Falhas = useMemo(
    () => ({
      ...SEM_FALHAS,
      cache: variante === "cache" ? redisDown : false,
      banco: variante === "cache" ? bancoDown : true,
    }),
    [variante, redisDown, bancoDown]
  );

  const padroesApi =
    variante === "timeout" ? [...protecoes] : ([] as string[]);

  const baseline = useMemo(() => {
    if (variante === "cache") {
      return montarSimulacao(estadoBase(), "leitura", true, SEM_FALHAS);
    }
    // baseline do timeout = banco down sem proteção (o “antes”)
    return montarSimulacao(estadoBase([]), "escrita", false, {
      ...SEM_FALHAS,
      banco: true,
    });
  }, [variante]);

  const sim = useMemo(() => {
    if (variante === "cache") {
      const cacheQuente = !falhas.cache;
      return montarSimulacao(
        estadoBase(),
        "leitura",
        cacheQuente,
        falhas
      );
    }
    return montarSimulacao(
      estadoBase(padroesApi),
      "escrita",
      false,
      falhas
    );
  }, [variante, falhas, padroesApi]);

  const visual = RESULTADO_VISUAL[sim.resultado];
  const Icone = visual.icon;
  const mudou = Math.abs(sim.totalMs - baseline.totalMs) > 0.0001;
  const maisRapido = sim.totalMs < baseline.totalMs;
  const leitura = leituraDaSessao(variante, falhas, protecoes);

  const alternarProtecao = (id: string) => {
    setProtecoes((atual) => {
      const next = new Set(atual);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // retry sem timeout não faz sentido pedagógico; exige timeout
      if (id === "timeout" && !next.has("timeout")) next.delete("retry");
      if (id === "retry" && next.has("retry") && !next.has("timeout")) {
        next.add("timeout");
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-card-border bg-card p-4 sm:p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Simulador de falha
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          {variante === "cache"
            ? "Derruba uma peça e compara com o hit normal."
            : "O banco já está fora. Vai colocando proteção e olha o custo cair."}
        </p>
      </div>

      {variante === "cache" ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Injetar falha
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(
              [
                {
                  id: "redis",
                  label: "Redis caiu",
                  on: redisDown,
                  toggle: () => setRedisDown((v) => !v),
                },
                {
                  id: "banco",
                  label: "Banco travou",
                  on: bancoDown,
                  toggle: () => setBancoDown((v) => !v),
                },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={t.toggle}
                aria-pressed={t.on}
                className={cn(
                  "min-h-11 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                  t.on
                    ? "border-[color-mix(in_srgb,var(--perigo)_45%,transparent)] bg-[color-mix(in_srgb,var(--perigo)_12%,transparent)] text-[var(--perigo)]"
                    : "border-card-border text-muted hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Proteger a borda
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PROTECOES.map((p) => {
              const on = protecoes.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => alternarProtecao(p.id)}
                  aria-pressed={on}
                  className={cn(
                    "min-h-11 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                    on
                      ? "border-primary/50 bg-primary/12 text-primary"
                      : "border-card-border text-muted hover:text-foreground"
                  )}
                >
                  {p.rotulo}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[14px] leading-relaxed text-foreground">{leitura}</p>

      {/* delta herói */}
      <div className="rounded-xl border border-card-border bg-background px-3.5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Latência sentida
            </p>
            <p
              className="mt-1 font-mono text-3xl font-bold tracking-tight tabular-nums sm:text-4xl"
              style={{ color: visual.cor }}
            >
              {formatarLatencia(sim.totalMs)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
            <Icone className="size-4" style={{ color: visual.cor }} />
            <span style={{ color: visual.cor }}>{visual.label}</span>
          </span>
        </div>

        {mudou && (
          <p className="mt-3 border-t border-card-border pt-3 text-[14px] leading-relaxed">
            <span className="text-muted">
              {variante === "cache" ? "contra o hit normal: " : "sem proteção: "}
            </span>
            <span className="font-mono text-muted">
              {formatarLatencia(baseline.totalMs)}
            </span>
            {" → "}
            <span className="font-mono font-semibold">
              {formatarLatencia(sim.totalMs)}
            </span>
            {maisRapido && baseline.totalMs > 0 && sim.totalMs > 0 && (
              <>
                {" "}
                <span className="font-semibold text-primary">
                  (
                  {formatarRazao(razao(sim.totalMs, baseline.totalMs))} mais
                  rápido)
                </span>
              </>
            )}
            {!maisRapido && sim.totalMs > baseline.totalMs && baseline.totalMs > 0 && (
              <>
                {" "}
                <span style={{ color: "var(--perigo)" }} className="font-semibold">
                  (
                  {formatarRazao(razao(baseline.totalMs, sim.totalMs))} mais
                  lento)
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <ol className="space-y-1.5">
        {sim.passos.map((p, i) => (
          <li
            key={`${p.no}-${i}`}
            className={cn(
              "flex gap-3 rounded-lg px-2.5 py-2 text-[13px] leading-snug",
              p.falha &&
                "bg-[color-mix(in_srgb,var(--perigo)_8%,transparent)]"
            )}
          >
            <span className="w-5 shrink-0 font-mono text-[11px] text-muted">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-medium">{p.rotulo}</span>
              <span className="text-muted"> · {p.detalhe}</span>
            </span>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
              {p.assincrono ? "async" : formatarLatencia(p.ms)}
            </span>
          </li>
        ))}
      </ol>

      {sim.avisos.length > 0 && (
        <ul className="space-y-1.5 border-t border-card-border pt-3">
          {sim.avisos.map((a) => (
            <li
              key={a}
              className="flex gap-2 text-[13px] leading-relaxed text-muted"
            >
              <TriangleAlert
                className="mt-0.5 size-3.5 shrink-0"
                style={{ color: "var(--alerta)" }}
              />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
