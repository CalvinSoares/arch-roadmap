"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  Zap,
  ArrowDown,
  AlertTriangle,
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  ScanSearch,
  Maximize2,
  Minimize2,
  Waypoints,
} from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { cn } from "@/shared/utils/cn";
import { camadaDef, padraoDef } from "@/content/construtor/blocos";
import { tecnologiaDef } from "@/content/construtor/tecnologias";
import { CAMADA_VISUAL, iconeDaTech } from "@/shared/config/construtor-visual";
import {
  useConnectorLayout,
  type ConnectorLink,
} from "@/shared/hook/use-connector-layout";
import type { CamadaId, EstadoProjeto } from "@/shared/types/construtor";
import {
  montarSimulacao,
  LABEL_TIPO,
  SEM_FALHAS,
  type Falhas,
  type TipoRequisicao,
} from "../utils/simulador";
import { FluxoControles, type Velocidade } from "./fluxo-controles";

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

interface Execucao {
  label: string;
  ms: number;
  resultado: "ok" | "degradado" | "erro";
}

export function FluxoProjeto({ estado }: { estado: EstadoProjeto }) {
  const [tipo, setTipo] = useState<TipoRequisicao>("leitura");
  const [cacheQuente, setCacheQuente] = useState(false);
  const [falhas, setFalhas] = useState<Falhas>(SEM_FALHAS);
  const [velocidade, setVelocidade] = useState<Velocidade>(1);
  const [passoAtual, setPassoAtual] = useState(-1);
  const [rodando, setRodando] = useState(false);
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [raioX, setRaioX] = useState<string | null>(null);
  const [expandido, setExpandido] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passoRef = useRef<HTMLLIElement>(null);

  const sim = useMemo(
    () => montarSimulacao(estado, tipo, cacheQuente, falhas),
    [estado, tipo, cacheQuente, falhas]
  );

  const labelConfig = useMemo(() => {
    const partes = [LABEL_TIPO[tipo].split(" ")[0]];
    if (tipo === "leitura" && sim.disponivel.cache)
      partes.push(cacheQuente ? "cache quente" : "cache frio");
    const caidas = [
      falhas.cache && sim.disponivel.cache && "cache",
      falhas.banco && sim.disponivel.banco && "banco",
      falhas.fila && sim.disponivel.fila && "fila",
    ].filter(Boolean);
    if (caidas.length) partes.push(`sem ${caidas.join("/")}`);
    return partes.join(" · ");
  }, [tipo, cacheQuente, falhas, sim.disponivel]);

  /**
   * Conectores: apenas o caminho da requisição atual. (As linhas de ordem da
   * pilha viviam aqui e cruzavam as trilhas, virando ruído desconexo — a ordem
   * já é explícita na aba Montar.)
   */
  const links = useMemo<ConnectorLink[]>(
    () =>
      sim.pares.map((p, i) => ({
        id: `sim:${i}:${p.assincrono ? "a" : "s"}${p.falha ? ":f" : ""}`,
        de: p.de,
        para: p.para,
        tipo: p.assincrono ? "ramo-opcional" : "ramo",
      })),
    [sim.pares]
  );

  const { containerRef, registerNode, paths } = useConnectorLayout(links);

  const enviar = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPassoAtual(0);
    setRodando(true);
  }, []);

  /**
   * Runner: avança um passo por tique. O `setState` fica no callback do
   * timer — um evento externo, que é onde a regra `set-state-in-effect`
   * espera encontrá-lo — em vez de no corpo do efeito.
   */
  useEffect(() => {
    if (!rodando) return;
    const ultimo = sim.passos.length - 1;
    if (ultimo < 0) return;

    timerRef.current = setTimeout(() => {
      const proximo = passoAtual + 1;
      setPassoAtual(Math.min(proximo, ultimo));
      if (proximo >= ultimo) {
        setRodando(false);
        setExecucoes((prev) =>
          [
            { label: labelConfig, ms: sim.totalMs, resultado: sim.resultado },
            ...prev,
          ].slice(0, 3)
        );
      }
    }, PASSO_MS / velocidade);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [rodando, passoAtual, sim, velocidade, labelConfig]);

  /**
   * Mudou projeto ou configuração → zera a animação (o histórico permanece).
   * Ajuste durante a renderização, não em efeito: evita pintar um quadro com
   * a animação antiga sobre a simulação nova.
   */
  const [simAnterior, setSimAnterior] = useState(sim);
  if (simAnterior !== sim) {
    setSimAnterior(sim);
    setPassoAtual(-1);
    setRodando(false);
  }

  // mantém o passo atual visível dentro da narração rolável
  useEffect(() => {
    passoRef.current?.scrollIntoView({ block: "nearest" });
  }, [passoAtual]);

  // tela cheia: atalhos (Esc/R/setas) e body sem rolagem atrás
  useEffect(() => {
    if (!expandido) return;
    const onKey = (e: KeyboardEvent) => {
      const digitando =
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName);
      if (digitando) return;

      if (e.key === "Escape") {
        setExpandido(false);
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        enviar();
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        setRodando(false);
        setPassoAtual((i) =>
          Math.max(
            0,
            Math.min(sim.passos.length - 1, (i < 0 ? 0 : i) + (e.key === "ArrowRight" ? 1 : -1))
          )
        );
      }
    };
    document.addEventListener("keydown", onKey);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowAnterior;
    };
  }, [expandido, enviar, sim.passos.length]);

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

  const controles = (
    <FluxoControles
      sim={sim}
      tipo={tipo}
      onTipo={setTipo}
      cacheQuente={cacheQuente}
      onCacheQuente={setCacheQuente}
      falhas={falhas}
      onFalhas={setFalhas}
      velocidade={velocidade}
      onVelocidade={setVelocidade}
      rodando={rodando}
      passoAtual={passoAtual}
      totalPassos={sim.passos.length}
      onEnviar={enviar}
      onLimpar={() => setPassoAtual(-1)}
      onPasso={(d) => {
        setRodando(false);
        setPassoAtual((i) => Math.max(0, Math.min(sim.passos.length - 1, i + d)));
      }}
    />
  );

  const diagrama = (
    <div
      ref={containerRef}
      className={cn(
        // @container: o layout reage à largura DESTE bloco, não da janela.
        // O diagrama mora numa coluna que pode ter 200px numa viewport de
        // 1400px — usar breakpoint de viewport fazia as trilhas irem para o
        // modo horizontal sem caber, e a última vazava para fora da borda.
        "@container/fluxo relative rounded-xl border border-card-border bg-canvas/50",
        // altura sempre acompanha o conteúdo — quem rola é o container externo
        expandido ? "p-6" : "p-4"
      )}
    >
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden h-full w-full @4xl/fluxo:block"
        >
          <defs>
            <marker id="seta-estrutura" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--muted)" />
            </marker>
            <marker id="seta-fluxo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--primary)" />
            </marker>
            <marker id="seta-falha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--cat-arquitetura)" />
            </marker>
          </defs>

          {paths.map((p) => {
            const partes = p.id.split(":");
            const idx = Number(partes[1]);
            const ehAsync = partes[2] === "a";
            const ehFalha = p.id.endsWith(":f");
            const percorrido = passoAtual >= idx + 1;
            const atual = passoAtual === idx + 1;

            // trecho ainda não percorrido: fica visível, mas apagado
            if (!percorrido) {
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill="none"
                  strokeLinecap="round"
                  stroke="var(--muted)"
                  strokeWidth={expandido ? 2 : 1.5}
                  strokeDasharray="5 7"
                  opacity={passoAtual >= 0 ? 0.22 : expandido ? 0.5 : 0.4}
                  markerEnd="url(#seta-estrutura)"
                />
              );
            }
            const cor = ehFalha ? "var(--cat-arquitetura)" : "var(--primary)";
            return (
              <g key={p.id}>
                <path
                  d={p.d}
                  fill="none"
                  strokeLinecap="round"
                  stroke={cor}
                  strokeWidth={expandido ? (atual ? 4.5 : 3) : atual ? 3 : 2}
                  strokeDasharray={atual || ehAsync ? "6 8" : undefined}
                  opacity={atual ? 1 : ehAsync ? 0.7 : 0.85}
                  className={
                    atual ? (ehAsync ? "conector-fluxo-async" : "conector-fluxo-ativo") : undefined
                  }
                  markerEnd={ehFalha ? "url(#seta-falha)" : "url(#seta-fluxo)"}
                />
                {atual && (
                  <circle r={expandido ? 6.5 : 4.5} fill={cor}>
                    <animateMotion dur={`${0.8 / velocidade}s`} repeatCount="indefinite" path={p.d} />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        <div
          className={cn(
            // empilhadas por padrão; lado a lado só quando há largura real
            "flex flex-col gap-6 @4xl/fluxo:flex-row @4xl/fluxo:items-stretch",
            // o respiro entre trilhas acompanha o espaço disponível
            "@4xl/fluxo:gap-4 @6xl/fluxo:gap-6",
            expandido && "@6xl/fluxo:gap-8"
          )}
        >
          {/* Usuário */}
          <div className="flex shrink-0 flex-col items-center gap-2 @4xl/fluxo:justify-center @4xl/fluxo:pt-7">
            <div
              ref={registerNode("usuario")}
              className={cn(
                "relative z-10 flex size-14 items-center justify-center rounded-full border-2 bg-card transition-all",
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
            <div aria-hidden className="flex flex-col items-center text-muted @4xl/fluxo:hidden">
              <span className="h-3 w-px border-l-2 border-dashed border-card-border" />
              <ArrowDown className="size-4" />
            </div>
          </div>

          {/* Trilhas */}
          {LANES.map((lane, iLane) => {
            const camadas = estado.camadas.filter((c) => lane.camadas.includes(c.camadaId));
            if (camadas.length === 0 && iLane > 0) {
              return (
                <div
                  key={lane.id}
                  className="hidden min-w-0 @4xl/fluxo:block @4xl/fluxo:flex-1 @4xl/fluxo:basis-0"
                >
                  <p className="mb-2 border-b border-dashed border-card-border pb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-muted">
                    {lane.titulo}
                  </p>
                  <p className="py-3 text-center text-xs text-muted/60">—</p>
                </div>
              );
            }
            return (
              <div
                key={lane.id}
                // sem largura mínima rígida: as trilhas dividem o espaço em
                // partes iguais e o conteúdo quebra linha em vez de vazar
                className="min-w-0 @4xl/fluxo:flex-1 @4xl/fluxo:basis-0"
              >
                {iLane > 0 && (
                  <div aria-hidden className="mb-3 flex flex-col items-center text-muted @4xl/fluxo:hidden">
                    <span className="h-3 w-px border-l-2 border-dashed border-card-border" />
                    <ArrowDown className="size-4" />
                  </div>
                )}
                <p className="mb-2 border-b border-dashed border-card-border pb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-muted [overflow-wrap:anywhere]">
                  {lane.titulo}
                </p>
                {/* Empilhado: fluxo vertical — cards de largura fixa,
                    centralizados sob o título, quebrando linha quando há
                    vários. Lado a lado (@4xl): coluna, um card por linha. */}
                <div
                  className={cn(
                    "flex flex-wrap justify-center",
                    "@4xl/fluxo:flex-col @4xl/fluxo:flex-nowrap @4xl/fluxo:justify-start",
                    expandido ? "gap-4" : "gap-2.5"
                  )}
                >
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
                    const comFalha = sim.passos.some(
                      (p, i) => p.no === c.camadaId && p.falha && passoAtual >= i
                    );
                    return (
                      <button
                        key={c.camadaId}
                        ref={registerNode(c.camadaId)}
                        type="button"
                        onClick={() => setRaioX(c.camadaId)}
                        title={`Raio-X de ${def.nome}`}
                        className={cn(
                          "group/no relative z-10 rounded-xl border-2 bg-card text-left transition-all hover:border-primary",
                          // empilhado: largura fixa (basis em eixo horizontal).
                          // lado a lado: `basis-auto`, senão o valor viraria
                          // altura, porque ali o eixo do flex é vertical.
                          "min-w-0 grow-0 basis-full @lg/fluxo:basis-56 @4xl/fluxo:basis-auto",
                          expandido ? "p-4" : "p-3",
                          comFalha
                            ? "border-cat-arquitetura ring-4 ring-cat-arquitetura/20"
                            : ativo
                              ? "border-primary ring-4 ring-primary/25"
                              : visitado
                                ? "border-primary/60"
                                : (v?.border ?? "border-card-border"),
                          // fora do caminho: borda tracejada (opacidade quebrava o
                          // contraste do texto — axe reprovava em 2.27)
                          passoAtual >= 0 && !visitado && !ativo && "border-dashed"
                        )}
                      >
                        <div className={cn("flex items-center", expandido ? "gap-2.5" : "gap-2")}>
                          <span
                            className={cn(
                              "flex shrink-0 items-center justify-center rounded-lg",
                              expandido ? "size-10" : "size-8",
                              v?.bg ?? "bg-muted/12"
                            )}
                          >
                            <Icone
                              className={cn(expandido ? "size-5" : "size-4", v?.text)}
                              strokeWidth={1.8}
                            />
                          </span>
                          <p
                            className={cn(
                              // nunca truncar. `anywhere` (e não `break-word`)
                              // porque só ele reduz a largura min-content — é o
                              // que garante que o card nunca empurre a trilha.
                              "min-w-0 [overflow-wrap:anywhere] font-semibold leading-tight",
                              expandido ? "text-[15px]" : "text-[13px]"
                            )}
                          >
                            {def.nome}
                          </p>
                          <ScanSearch className="ml-auto hidden size-3.5 shrink-0 self-start text-muted opacity-0 transition-opacity group-hover/no:opacity-100 @6xl/fluxo:block" />
                        </div>
                        {expandido && (
                          <p className="mt-1.5 text-xs leading-relaxed text-muted">
                            {def.descricao}
                          </p>
                        )}
                        {c.tecnologias.length > 0 && (
                          <div
                            className={cn(
                              "flex flex-wrap gap-1",
                              expandido ? "mt-3 gap-1.5" : "mt-2"
                            )}
                          >
                            {c.tecnologias.map((tid) => {
                              const t = tecnologiaDef(tid);
                              const IconeT = iconeDaTech(tid);
                              if (!t) return null;
                              const caiu =
                                (falhas.cache && ["redis", "memcached"].includes(tid)) ||
                                (falhas.banco && ["postgres", "mongodb"].includes(tid)) ||
                                (falhas.fila && ["kafka", "rabbitmq"].includes(tid));
                              return (
                                <span
                                  key={tid}
                                  title={caiu ? `${t.nome} — fora do ar` : t.nome}
                                  className={cn(
                                    "flex min-w-0 items-center gap-1 rounded-md font-medium",
                                    expandido
                                      ? "px-2 py-1 text-[11px]"
                                      : "px-1.5 py-0.5 text-[10px]",
                                    caiu
                                      ? "bg-cat-arquitetura/15 text-cat-arquitetura line-through"
                                      : "bg-muted/10 text-muted"
                                  )}
                                >
                                  <IconeT
                                    className={cn(
                                      "shrink-0",
                                      expandido ? "size-3.5" : "size-3"
                                    )}
                                  />
                                  <span className="min-w-0 [overflow-wrap:anywhere]">
                                    {t.nome}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const avisos = passoAtual >= 0 && sim.avisos.length > 0 && (
    <div className="space-y-2">
      {sim.avisos.map((a) => (
        <p
          key={a}
          className="flex gap-2 rounded-xl border border-cat-principio/40 bg-cat-principio/8 p-3 text-[13px] leading-relaxed text-foreground"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-cat-principio" />
          {a}
        </p>
      ))}
    </div>
  );

  const narracao = passoAtual >= 0 && (
    <ol
      aria-label="Narração da requisição"
      tabIndex={0}
      className={cn(
        "space-y-1.5 rounded-xl border border-card-border bg-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        // em tela cheia cresce livre (quem rola é o container); inline fica contido
        expandido ? "" : "max-h-56 overflow-y-auto"
      )}
    >
          {sim.passos.slice(0, passoAtual + 1).map((p, i) => (
            <li
              key={i}
              ref={i === passoAtual ? passoRef : undefined}
              className={cn(
                "flex items-baseline gap-2 text-sm",
                i === passoAtual && "font-medium"
              )}
            >
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                  p.falha
                    ? "bg-cat-arquitetura/15 text-cat-arquitetura"
                    : p.assincrono
                      ? "bg-cat-comportamental/12 text-cat-comportamental"
                      : "bg-primary/12 text-primary"
                )}
              >
                {p.assincrono ? "async" : `${p.ms}ms`}
              </span>
              <span className="min-w-0">
                <b>{p.rotulo}:</b> <span className="text-muted">{p.detalhe}</span>
              </span>
            </li>
          ))}
    </ol>
  );

  const raioXPainel = raioX && (
    <RaioX camadaId={raioX} estado={estado} sim={sim} onClose={() => setRaioX(null)} />
  );

  // ——— tela cheia: diagrama grande + narração ao lado ———
  if (expandido) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* topo fixo: cabeçalho + controles */}
        <div className="flex shrink-0 flex-col gap-3 p-3 pb-0 sm:gap-4 sm:p-4 sm:pb-0 lg:p-6 lg:pb-0">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-card-border bg-primary/10 text-primary">
              <Waypoints className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">Fluxo da requisição</p>
              <p className="truncate text-xs text-muted">
                {LABEL_TIPO[tipo]} · {estado.camadas.length} camadas ·{" "}
                {passoAtual >= 0
                  ? `passo ${passoAtual + 1} de ${sim.passos.length}`
                  : `${sim.totalMs.toFixed(1).replace(".0", "")}ms estimados`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="hidden items-center gap-1.5 text-[11px] text-muted xl:flex">
              <kbd className="rounded border border-card-border px-1.5 py-0.5 font-mono">R</kbd>
              rodar
              <kbd className="ml-1.5 rounded border border-card-border px-1.5 py-0.5 font-mono">←→</kbd>
              passos
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandido(false)}
              aria-label="Sair da tela cheia"
            >
              <Minimize2 />
              <span className="hidden sm:inline">Sair da tela cheia</span>
              <span className="sm:hidden">Sair</span>
              <kbd className="ml-1 hidden rounded border border-card-border px-1 text-[10px] sm:inline">
                Esc
              </kbd>
            </Button>
          </div>
        </div>

          {controles}
        </div>

        {/* a tela toda rola; o diagrama usa a largura inteira */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="flex flex-col gap-4">
            {diagrama}
            {raioXPainel}
            {avisos}
            {/* narração e comparação lado a lado abaixo do diagrama */}
            {(passoAtual >= 0 || execucoes.length > 0) && (
              <div
                className={cn(
                  "grid items-start gap-4",
                  passoAtual >= 0 && execucoes.length > 0
                    ? "lg:grid-cols-[minmax(0,1fr)_340px]"
                    : "grid-cols-1"
                )}
              >
                {narracao}
                {execucoes.length > 0 && <Comparador execucoes={execucoes} />}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {controles}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setExpandido(true)}>
          <Maximize2 /> Expandir visualização
        </Button>
      </div>

      {diagrama}
      {raioXPainel}
      {avisos}
      {narracao}
      {execucoes.length > 0 && <Comparador execucoes={execucoes} />}
    </div>
  );
}

function Comparador({ execucoes }: { execucoes: Execucao[] }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Comparar execuções
      </p>
      <ul className="space-y-1.5">
        {execucoes.map((e, i) => {
          const anterior = execucoes[i + 1];
          const delta = anterior ? e.ms - anterior.ms : null;
          const pct =
            delta !== null && anterior && anterior.ms > 0
              ? Math.round((delta / anterior.ms) * 100)
              : null;
          const Icone = delta === null || delta === 0 ? Minus : delta < 0 ? TrendingDown : TrendingUp;
          return (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-muted">{e.label}</span>
              <span
                className={cn(
                  "shrink-0 tabular-nums font-medium",
                  e.resultado === "erro"
                    ? "text-cat-arquitetura"
                    : e.resultado === "degradado"
                      ? "text-cat-principio"
                      : "text-foreground"
                )}
              >
                {e.resultado === "erro" ? "erro" : `${e.ms.toFixed(1).replace(".0", "")}ms`}
              </span>
              {pct !== null && e.resultado !== "erro" && (
                <span
                  className={cn(
                    "flex w-16 shrink-0 items-center justify-end gap-0.5 text-[11px] tabular-nums",
                    delta! < 0 ? "text-cat-criacional" : delta! > 0 ? "text-cat-principio" : "text-muted"
                  )}
                >
                  <Icone className="size-3" />
                  {delta! > 0 ? "+" : ""}
                  {pct}%
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        Cada linha é uma execução; a variação compara com a execução anterior da
        lista — troque as condições e rode de novo para medir o efeito.
      </p>
    </div>
  );
}

function RaioX({
  camadaId,
  estado,
  sim,
  onClose,
}: {
  camadaId: string;
  estado: EstadoProjeto;
  sim: ReturnType<typeof montarSimulacao>;
  onClose: () => void;
}) {
  const def = camadaDef(camadaId);
  const camada = estado.camadas.find((c) => c.camadaId === camadaId);
  if (!def || !camada) return null;

  const idxUltimo = sim.passos.map((p) => p.no).lastIndexOf(camadaId);
  const acumulado =
    idxUltimo >= 0
      ? sim.passos
          .slice(0, idxUltimo + 1)
          .filter((p) => !p.assincrono)
          .reduce((a, p) => a + p.ms, 0)
      : null;
  const passosAqui = sim.passos.filter((p) => p.no === camadaId);
  const v = CAMADA_VISUAL[camadaId];
  const Icone = v?.icon ?? User;

  return (
    <div className="rounded-xl border-2 border-primary/50 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cn("flex size-9 items-center justify-center rounded-lg", v?.bg)}>
            <Icone className={cn("size-4.5", v?.text)} strokeWidth={1.8} />
          </span>
          <div>
            <p className="flex items-center gap-1.5 font-semibold">
              <ScanSearch className="size-3.5 text-primary" /> {def.nome}
            </p>
            <p className="text-xs text-muted">{def.descricao}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar raio-X"
          className="rounded-md p-1 text-muted hover:bg-muted/10"
        >
          <X className="size-4" />
        </button>
      </div>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-muted">Tecnologias</dt>
          <dd className="mt-0.5 font-medium">
            {camada.tecnologias.length
              ? camada.tecnologias.map((t) => tecnologiaDef(t)?.nome ?? t).join(", ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Padrões</dt>
          <dd className="mt-0.5 font-medium">
            {camada.padroes.length
              ? camada.padroes.map((p) => padraoDef(p)?.nome ?? p).join(", ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Latência acumulada</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {acumulado !== null
              ? `~${acumulado.toFixed(1).replace(".0", "")}ms até aqui`
              : "fora do caminho desta requisição"}
          </dd>
        </div>
      </dl>

      {passosAqui.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-card-border pt-2">
          {passosAqui.map((p, i) => (
            <li key={i} className="text-xs leading-relaxed text-muted">
              <b className={p.falha ? "text-cat-arquitetura" : "text-foreground"}>
                {p.rotulo}:
              </b>{" "}
              {p.detalhe}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
