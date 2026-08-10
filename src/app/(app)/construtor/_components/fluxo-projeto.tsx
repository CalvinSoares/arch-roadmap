"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  User,
  Flame,
  Snowflake,
  Zap,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { cn } from "@/shared/utils/cn";
import { camadaDef } from "@/content/construtor/blocos";
import { tecnologiaDef } from "@/content/construtor/tecnologias";
import {
  CAMADA_VISUAL,
  iconeDaTech,
} from "@/shared/config/construtor-visual";
import {
  useConnectorLayout,
  type ConnectorLink,
} from "@/shared/hook/use-connector-layout";
import type { CamadaId, EstadoProjeto } from "@/shared/types/construtor";
import {
  montarSimulacao,
  type TipoRequisicao,
} from "../utils/simulador";

const LANES: { id: string; titulo: string; camadas: CamadaId[] }[] = [
  { id: "cliente", titulo: "Cliente", camadas: ["ui"] },
  { id: "borda", titulo: "Borda", camadas: ["api"] },
  { id: "app", titulo: "Aplicação", camadas: ["aplicacao", "dominio"] },
  {
    id: "dados",
    titulo: "Dados & Infra",
    camadas: ["read-store", "write-store", "fila", "infra"],
  },
];

const PASSO_MS = 850;

export function FluxoProjeto({ estado }: { estado: EstadoProjeto }) {
  const [tipo, setTipo] = useState<TipoRequisicao>("leitura");
  const [cacheQuente, setCacheQuente] = useState(false);
  const [passoAtual, setPassoAtual] = useState(-1);
  const [rodando, setRodando] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sim = useMemo(
    () => montarSimulacao(estado, tipo, cacheQuente),
    [estado, tipo, cacheQuente]
  );

  // conectores: estrutura (pilha em ordem) + caminho da simulação atual
  const links = useMemo<ConnectorLink[]>(() => {
    const l: ConnectorLink[] = [];
    let anterior = "usuario";
    for (const c of estado.camadas) {
      l.push({
        id: `est:${anterior}>${c.camadaId}`,
        de: anterior,
        para: c.camadaId,
        tipo: "ramo-opcional",
      });
      anterior = c.camadaId;
    }
    sim.pares.forEach((p, i) => {
      l.push({
        id: `sim:${i}:${p.assincrono ? "a" : "s"}`,
        de: p.de,
        para: p.para,
        tipo: p.assincrono ? "ramo-opcional" : "ramo",
      });
    });
    return l;
  }, [estado.camadas, sim.pares]);

  const { containerRef, registerNode, paths } = useConnectorLayout(links);

  // runner da simulação
  const enviar = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPassoAtual(0);
    setRodando(true);
  };

  useEffect(() => {
    if (!rodando) return;
    if (passoAtual >= sim.passos.length - 1) {
      setRodando(false);
      return;
    }
    timerRef.current = setTimeout(
      () => setPassoAtual((i) => i + 1),
      PASSO_MS
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [rodando, passoAtual, sim.passos.length]);

  // muda o projeto/config → zera a simulação
  useEffect(() => {
    setPassoAtual(-1);
    setRodando(false);
  }, [sim]);

  const noAtivo = passoAtual >= 0 ? sim.passos[passoAtual]?.no : null;
  const nosVisitados = useMemo(
    () => new Set(sim.passos.slice(0, Math.max(0, passoAtual + 1)).map((p) => p.no)),
    [sim.passos, passoAtual]
  );

  if (estado.camadas.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-card-border bg-canvas/50 p-6 text-center">
        <Zap className="size-8 text-muted" />
        <p className="font-medium">Nada para simular ainda</p>
        <p className="max-w-xs text-sm text-muted">
          Volte para a aba <b>Montar</b>, adicione camadas e tecnologias — e
          então veja a requisição atravessar seu projeto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles da simulação */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-card-border bg-card p-3">
        <div className="flex overflow-hidden rounded-lg border border-card-border">
          {(["leitura", "escrita"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors",
                tipo === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              {t === "leitura" ? "Leitura (GET)" : "Escrita (POST)"}
            </button>
          ))}
        </div>

        {tipo === "leitura" && sim.temCache && (
          <button
            type="button"
            onClick={() => setCacheQuente((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              cacheQuente
                ? "border-cat-principio/60 bg-cat-principio/12 text-cat-principio"
                : "border-card-border text-muted hover:text-foreground"
            )}
            title="Alterne entre cache quente (HIT) e frio (MISS)"
          >
            {cacheQuente ? <Flame className="size-4" /> : <Snowflake className="size-4" />}
            {cacheQuente ? "Cache quente (HIT)" : "Cache frio (MISS)"}
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {passoAtual >= 0 && !rodando && (
            <Button variant="ghost" size="sm" onClick={() => setPassoAtual(-1)}>
              <RotateCcw /> Limpar
            </Button>
          )}
          <Button size="sm" onClick={enviar} disabled={rodando}>
            <Play /> {rodando ? "Percorrendo…" : "Enviar requisição"}
          </Button>
        </div>
      </div>

      {/* Diagrama de trilhas */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-card-border bg-canvas/50 p-4"
      >
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        >
          <defs>
            <marker
              id="seta-estrutura"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--muted)" />
            </marker>
            <marker
              id="seta-fluxo"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--primary)" />
            </marker>
          </defs>

          {paths.map((p) => {
            const ehSim = p.id.startsWith("sim:");
            if (!ehSim) {
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill="none"
                  strokeLinecap="round"
                  stroke="var(--muted)"
                  strokeWidth={1.5}
                  strokeDasharray="4 7"
                  opacity={passoAtual >= 0 ? 0.2 : 0.45}
                  markerEnd="url(#seta-estrutura)"
                />
              );
            }
            const idx = Number(p.id.split(":")[1]);
            const ehAsync = p.id.endsWith(":a");
            // par[i] chega no passo[i+1]; percorrido = já passou por ele
            const percorrido = passoAtual >= idx + 1;
            const atual = passoAtual === idx + 1;
            if (!percorrido) return null;
            return (
              <g key={p.id}>
                <path
                  id={`caminho-${idx}`}
                  d={p.d}
                  fill="none"
                  strokeLinecap="round"
                  stroke="var(--primary)"
                  strokeWidth={atual ? 3 : 2}
                  strokeDasharray={atual || ehAsync ? "6 8" : undefined}
                  opacity={atual ? 1 : ehAsync ? 0.65 : 0.8}
                  className={
                    atual
                      ? ehAsync
                        ? "conector-fluxo-async"
                        : "conector-fluxo-ativo"
                      : undefined
                  }
                  markerEnd="url(#seta-fluxo)"
                />
                {atual && (
                  <circle r="4.5" fill="var(--primary)">
                    <animateMotion dur="0.8s" repeatCount="indefinite" path={p.d} />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[auto_repeat(4,minmax(0,1fr))] lg:items-start lg:gap-5">
          {/* Usuário */}
          <div className="flex flex-col items-center gap-2 lg:pt-8">
            <div
              ref={registerNode("usuario")}
              className={cn(
                "relative z-10 flex size-14 flex-col items-center justify-center rounded-full border-2 bg-card transition-all",
                noAtivo === "usuario"
                  ? "border-primary ring-4 ring-primary/25"
                  : nosVisitados.has("usuario")
                    ? "border-primary/60"
                    : "border-card-border"
              )}
            >
              <User className="size-5 text-foreground" />
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Usuário
            </span>
            {/* ligação para a primeira trilha (mobile) */}
            <div aria-hidden className="flex flex-col items-center text-muted lg:hidden">
              <span className="h-3 w-px border-l-2 border-dashed border-card-border" />
              <ArrowDown className="size-4" />
            </div>
          </div>

          {/* Trilhas */}
          {LANES.map((lane, iLane) => {
            const camadas = estado.camadas.filter((c) =>
              lane.camadas.includes(c.camadaId)
            );
            if (camadas.length === 0 && iLane > 0) {
              // trilha vazia: só ocupa a coluna no desktop
              return (
                <div key={lane.id} className="hidden min-w-0 lg:block">
                  <p className="mb-2 border-b border-dashed border-card-border pb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-muted">
                    {lane.titulo}
                  </p>
                  <p className="py-3 text-center text-xs text-muted/60">—</p>
                </div>
              );
            }
            return (
              <div key={lane.id} className="min-w-0">
                {/* seta de ligação entre trilhas (mobile) */}
                {iLane > 0 && (
                  <div
                    aria-hidden
                    className="mb-3 flex flex-col items-center text-muted lg:hidden"
                  >
                    <span className="h-3 w-px border-l-2 border-dashed border-card-border" />
                    <ArrowDown className="size-4" />
                  </div>
                )}
                <p className="mb-2 border-b border-dashed border-card-border pb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-muted">
                  {lane.titulo}
                </p>
                <div className="flex flex-col gap-3">
                  {camadas.length === 0 && (
                    <p className="py-3 text-center text-xs text-muted/60">—</p>
                  )}
                  {camadas.map((c) => {
                    const def = camadaDef(c.camadaId);
                    const v = CAMADA_VISUAL[c.camadaId];
                    const Icone = v?.icon ?? User;
                    if (!def) return null;
                    const ativo = noAtivo === c.camadaId;
                    const visitado = nosVisitados.has(c.camadaId);
                    return (
                      <div
                        key={c.camadaId}
                        ref={registerNode(c.camadaId)}
                        className={cn(
                          "relative z-10 rounded-xl border-2 bg-card p-3 transition-all",
                          ativo
                            ? "border-primary ring-4 ring-primary/25"
                            : visitado
                              ? "border-primary/60"
                              : (v?.border ?? "border-card-border"),
                          passoAtual >= 0 && !visitado && !ativo && "opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg",
                              v?.bg ?? "bg-muted/12"
                            )}
                          >
                            <Icone className={cn("size-4", v?.text)} strokeWidth={1.8} />
                          </span>
                          <p className="truncate text-sm font-semibold">{def.nome}</p>
                        </div>
                        {c.tecnologias.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {c.tecnologias.map((tid) => {
                              const t = tecnologiaDef(tid);
                              const IconeT = iconeDaTech(tid);
                              if (!t) return null;
                              return (
                                <span
                                  key={tid}
                                  title={t.nome}
                                  className="flex items-center gap-1 rounded-md bg-muted/10 px-1.5 py-0.5 text-[10px] font-medium text-muted"
                                >
                                  <IconeT className="size-3" />
                                  {t.nome}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Narração da simulação */}
      {passoAtual >= 0 && (
        <ol
          aria-label="Narração da requisição"
          className="space-y-1.5 rounded-xl border border-card-border bg-card p-4"
        >
          {sim.passos.slice(0, passoAtual + 1).map((p, i) => (
            <li
              key={i}
              className={cn(
                "flex items-baseline gap-2 text-sm",
                i === passoAtual && "font-medium"
              )}
            >
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                  p.assincrono
                    ? "bg-cat-comportamental/12 text-cat-comportamental"
                    : "bg-primary/12 text-primary"
                )}
              >
                {p.assincrono ? "async" : `${p.ms}ms`}
              </span>
              <span className="min-w-0">
                <b>{p.rotulo}:</b>{" "}
                <span className="text-muted">{p.detalhe}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
