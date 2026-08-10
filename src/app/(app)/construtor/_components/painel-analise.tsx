"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  Info,
  Trash2,
  Wand2,
  Share2,
  FileDown,
  Unlink,
  FlaskConical,
  Gauge,
  ShieldCheck,
  Wallet,
  ListChecks,
  ClipboardCheck,
  Plus,
  CheckCircle2,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  MessageSquareText,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { cn } from "@/shared/utils/cn";
import { TEMPLATES } from "@/content/construtor/regras";
import type { Insight, NivelInsight, ScoreProjeto } from "@/shared/types/construtor";
import type { RevisaoProjeto, Sugestao } from "@/content/construtor/sugestoes";
import type { UltimaAcao } from "../hook/construtor.hook";

const NIVEL = {
  alerta: {
    icone: AlertTriangle,
    cor: "text-cat-principio",
    regua: "bg-cat-principio",
    fundo: "bg-cat-principio/[0.07]",
    label: "Alerta",
  },
  sinergia: {
    icone: Sparkles,
    cor: "text-cat-criacional",
    regua: "bg-cat-criacional",
    fundo: "bg-cat-criacional/[0.06]",
    label: "Sinergia",
  },
  info: {
    icone: Info,
    cor: "text-cat-estrutural",
    regua: "bg-cat-estrutural",
    fundo: "bg-cat-estrutural/[0.06]",
    label: "Observação",
  },
} as const;

const PESO_NIVEL: Record<NivelInsight, number> = { alerta: 0, sinergia: 1, info: 2 };

/** Rótulo qualitativo: dá âncora ao número (invertida = menor é melhor). */
function faixa(valor: number, invertida?: boolean) {
  const alto = valor >= 66;
  const medio = valor >= 33;
  if (invertida) {
    if (alto) return { texto: "Alto", classe: "text-cat-principio" };
    if (medio) return { texto: "Médio", classe: "text-muted" };
    return { texto: "Baixo", classe: "text-cat-criacional" };
  }
  if (alto) return { texto: "Alto", classe: "text-cat-criacional" };
  if (medio) return { texto: "Médio", classe: "text-muted" };
  return { texto: "Baixo", classe: "text-cat-principio" };
}

function BarraScore({
  label,
  valor,
  icone: Icone,
  ajuda,
  referencia,
  invertida,
}: {
  label: string;
  valor: number;
  icone: LucideIcon;
  ajuda: string;
  /** valor do modelo carregado — vira marca-fantasma na barra. */
  referencia?: number;
  invertida?: boolean;
}) {
  const bom = invertida ? valor <= 55 : valor >= 55;
  const f = faixa(valor, invertida);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 text-muted" title={ajuda}>
          <Icone className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <span className="flex shrink-0 items-baseline gap-1.5">
          <span className={cn("text-[10px] font-medium uppercase", f.classe)}>
            {f.texto}
          </span>
          <span className="font-medium tabular-nums">{valor}</span>
        </span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-card-border">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            bom ? "bg-cat-criacional" : "bg-cat-principio"
          )}
          style={{ width: `${valor}%` }}
        />
        {referencia !== undefined && Math.abs(referencia - valor) > 1 && (
          <span
            title={`Modelo de referência: ${referencia}`}
            className="absolute top-[-2px] h-[10px] w-0.5 rounded bg-foreground/60"
            style={{ left: `calc(${referencia}% - 1px)` }}
          />
        )}
      </div>
    </div>
  );
}

/** Bloco recolhível usado nas seções longas do painel. */
function Secao({
  titulo,
  contagem,
  aberta,
  onToggle,
  children,
}: {
  titulo: string;
  contagem?: number;
  aberta: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-card-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberta}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted transition-colors hover:text-foreground"
      >
        <ChevronRight
          className={cn("size-3.5 shrink-0 transition-transform", aberta && "rotate-90")}
        />
        <span className="flex-1 text-left">{titulo}</span>
        {contagem !== undefined && (
          <span className="rounded-full bg-muted/12 px-1.5 text-[10px] tabular-nums">
            {contagem}
          </span>
        )}
      </button>
      {aberta && <div className="border-t border-card-border p-3">{children}</div>}
    </section>
  );
}

type Aba = "analise" | "proximos" | "modelos";

const ABAS: { id: Aba; label: string; icone: LucideIcon }[] = [
  { id: "analise", label: "Análise", icone: Lightbulb },
  { id: "proximos", label: "Próximos", icone: ListChecks },
  { id: "modelos", label: "Modelos", icone: Wand2 },
];

const FILTROS: { id: NivelInsight | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "alerta", label: "Alertas" },
  { id: "sinergia", label: "Sinergias" },
  { id: "info", label: "Notas" },
];

interface Props {
  ultimaAcao: UltimaAcao | null;
  insights: Insight[];
  score: ScoreProjeto;
  /** score do modelo carregado — marca de referência nas barras. */
  referencia: ScoreProjeto | null;
  sugestoes: Sugestao[];
  revisao: RevisaoProjeto;
  temCamadas: boolean;
  onTemplate: (id: string) => void;
  onLimpar: () => void;
  onCompartilhar: () => void;
  onExportarADR: () => void;
  onAplicarSugestao: (s: Sugestao) => void;
}

export function PainelAnalise({
  ultimaAcao,
  insights,
  score,
  referencia,
  sugestoes,
  revisao,
  temCamadas,
  onTemplate,
  onLimpar,
  onCompartilhar,
  onExportarADR,
  onAplicarSugestao,
}: Props) {
  const [aba, setAba] = useState<Aba>("analise");
  const [filtro, setFiltro] = useState<NivelInsight | "todos">("todos");
  /** insights abertos; o padrão (alerta aberto) vale enquanto o id não for tocado. */
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});
  const [verScore, setVerScore] = useState(true);
  const [verFatores, setVerFatores] = useState(false);
  const [verRevisao, setVerRevisao] = useState(false);

  const corpoRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  /**
   * Cada nova narração nasce expandida — é o retorno da ação do usuário.
   * Ajuste durante o render (e não em efeito) para não encadear re-renders.
   */
  const [narracao, setNarracao] = useState({
    de: ultimaAcao,
    aberta: true,
    oculta: false,
  });
  if (narracao.de !== ultimaAcao) {
    setNarracao({ de: ultimaAcao, aberta: true, oculta: false });
  }
  const narracaoAberta = narracao.aberta;
  const narracaoOculta = narracao.oculta;

  // Trocar de aba sempre começa do topo: nada de herdar o scroll da aba anterior.
  useEffect(() => {
    corpoRef.current?.scrollTo({ top: 0 });
  }, [aba]);

  const contagem = {
    todos: insights.length,
    alerta: insights.filter((i) => i.nivel === "alerta").length,
    sinergia: insights.filter((i) => i.nivel === "sinergia").length,
    info: insights.filter((i) => i.nivel === "info").length,
  };
  const alertas = contagem.alerta;

  const listados = [...insights]
    .filter((i) => filtro === "todos" || i.nivel === filtro)
    .sort((a, b) => PESO_NIVEL[a.nivel] - PESO_NIVEL[b.nivel]);

  /** Setas navegam entre as abas, como manda o padrão de tablist. */
  const onTeclaAba = (e: React.KeyboardEvent) => {
    const passo = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const i = ABAS.findIndex((a) => a.id === aba);
    const proxima = ABAS[(i + passo + ABAS.length) % ABAS.length];
    setAba(proxima.id);
    tabsRef.current
      ?.querySelector<HTMLButtonElement>(`[data-aba="${proxima.id}"]`)
      ?.focus();
  };

  return (
    <aside
      aria-label="Análise do projeto"
      className="flex flex-col gap-3 lg:sticky lg:top-20 lg:h-[calc(100dvh-6rem)] lg:min-h-[520px] lg:self-start"
    >
      {/* ═══ Cabeçalho fixo: narração + abas — nunca some com o scroll ═══ */}
      {ultimaAcao && !narracaoOculta && (
        /* max-h em % do painel: a narração nunca passa de ~1/4 da coluna. */
        <div className="flex shrink-0 flex-col overflow-hidden rounded-xl border border-primary/40 bg-primary/8 lg:max-h-[28%]">
          <div className="flex shrink-0 items-start gap-1.5 p-3">
            <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <button
              type="button"
              onClick={() => setNarracao((n) => ({ ...n, aberta: !n.aberta }))}
              aria-expanded={narracaoAberta}
              className="min-w-0 flex-1 text-left text-[13px] font-medium leading-snug text-primary"
            >
              {ultimaAcao.titulo}
            </button>
            <ChevronDown
              className={cn(
                "mt-0.5 size-3.5 shrink-0 text-primary/70 transition-transform",
                narracaoAberta && "rotate-180"
              )}
            />
            <button
              type="button"
              onClick={() => setNarracao((n) => ({ ...n, oculta: true }))}
              aria-label="Dispensar narração"
              className="-mr-1 -mt-1 shrink-0 rounded p-1 text-primary/60 transition-colors hover:bg-primary/12 hover:text-primary"
            >
              <X className="size-3.5" />
            </button>
          </div>
          {narracaoAberta && (
            <div className="min-h-0 flex-1 overflow-y-auto border-t border-primary/20 px-3 py-2.5">
              <p className="text-[13px] leading-relaxed text-foreground">
                {ultimaAcao.descricao}
              </p>
              {ultimaAcao.bullets && ultimaAcao.bullets.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {ultimaAcao.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex gap-2 text-xs leading-relaxed text-muted"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Painel de análise"
        onKeyDown={onTeclaAba}
        className="grid shrink-0 grid-cols-3 gap-1 rounded-xl border border-card-border bg-card p-1"
      >
        {ABAS.map(({ id, label, icone: Icone }) => {
          const ativa = aba === id;
          const badge =
            id === "analise" ? alertas : id === "proximos" ? sugestoes.length : 0;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              data-aba={id}
              aria-selected={ativa}
              aria-controls={`painel-${id}`}
              tabIndex={ativa ? 0 : -1}
              onClick={() => setAba(id)}
              className={cn(
                "flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-1 py-2 text-xs font-medium transition-colors",
                ativa
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <Icone className="size-3.5 shrink-0" />
              {label}
              {badge > 0 && (
                <span
                  className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                    ativa
                      ? "bg-primary-foreground/25 text-primary-foreground"
                      : id === "analise"
                        ? "bg-cat-principio/15 text-cat-principio"
                        : "bg-muted/15 text-muted"
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ Corpo: a única coisa que rola ═══ */}
      <div
        ref={corpoRef}
        id={`painel-${aba}`}
        role="tabpanel"
        className="min-h-0 flex-1 space-y-2.5 lg:overflow-y-auto lg:pr-1"
      >
        {/* ——— Aba: Análise (leitura do projeto + insights) ——— */}
        {aba === "analise" && (
          <>
            {temCamadas ? (
              <Secao
                titulo="Leitura do projeto"
                aberta={verScore}
                onToggle={() => setVerScore((v) => !v)}
              >
                <div className="space-y-3">
                  <BarraScore
                    label="Desacoplamento"
                    valor={score.desacoplamento}
                    referencia={referencia?.desacoplamento}
                    icone={Unlink}
                    ajuda="Quão independentes são as peças: trocar banco, framework ou SDK sem tocar nas regras de negócio."
                  />
                  <BarraScore
                    label="Testabilidade"
                    valor={score.testabilidade}
                    referencia={referencia?.testabilidade}
                    icone={FlaskConical}
                    ajuda="Quanto do sistema você testa sem subir infraestrutura (banco, fila, HTTP)."
                  />
                  <BarraScore
                    label="Resiliência"
                    valor={score.resiliencia}
                    referencia={referencia?.resiliencia}
                    icone={ShieldCheck}
                    ajuda="O que continua funcionando quando uma peça cai: cache serve leitura, fila absorve escrita, Saga compensa."
                  />
                  <BarraScore
                    label="Complexidade"
                    valor={score.complexidade}
                    referencia={referencia?.complexidade}
                    icone={Gauge}
                    invertida
                    ajuda="Quantidade de camadas, padrões e tecnologias — cada peça precisa pagar o próprio custo."
                  />
                  <BarraScore
                    label="Custo operacional"
                    valor={score.custoOperacional}
                    referencia={referencia?.custoOperacional}
                    icone={Wallet}
                    invertida
                    ajuda="Esforço de manter as tecnologias no ar: deploy, backup, alertas e plantão. Kafka pesa mais que Memcached."
                  />
                  {referencia && (
                    <p className="flex items-center gap-1.5 text-[11px] text-muted">
                      <span className="h-2.5 w-0.5 rounded bg-foreground/60" />
                      marca = modelo carregado
                    </p>
                  )}
                  {score.fatores.length > 0 && (
                    <div className="border-t border-card-border pt-2">
                      <button
                        type="button"
                        onClick={() => setVerFatores((v) => !v)}
                        aria-expanded={verFatores}
                        className="flex w-full items-center gap-1 text-left text-[11px] font-medium text-muted transition-colors hover:text-foreground"
                      >
                        <ChevronRight
                          className={cn(
                            "size-3.5 shrink-0 transition-transform",
                            verFatores && "rotate-90"
                          )}
                        />
                        Como esses números foram montados ({score.fatores.length})
                      </button>
                      {verFatores && (
                        <ul className="mt-2 space-y-1 pl-4 text-[11px] leading-relaxed text-muted">
                          {score.fatores.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </Secao>
            ) : (
              <p className="rounded-xl border border-dashed border-card-border p-4 text-center text-xs leading-relaxed text-muted">
                Monte o projeto — ou carregue um modelo na aba{" "}
                <b className="text-foreground">Modelos</b> — e as consequências de
                cada escolha aparecem aqui.
              </p>
            )}

            {insights.length > 0 && (
              <>
                <div className="flex flex-wrap gap-1">
                  {FILTROS.map(({ id, label }) => {
                    const n = contagem[id];
                    const ativo = filtro === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFiltro(id)}
                        disabled={n === 0 && id !== "todos"}
                        aria-pressed={ativo}
                        className={cn(
                          "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-35",
                          ativo
                            ? id === "alerta"
                              ? "bg-cat-principio/15 text-cat-principio"
                              : id === "sinergia"
                                ? "bg-cat-criacional/15 text-cat-criacional"
                                : "bg-primary/12 text-primary"
                            : "text-muted enabled:hover:bg-foreground/5 enabled:hover:text-foreground"
                        )}
                      >
                        {label}
                        <span className="tabular-nums opacity-70">{n}</span>
                      </button>
                    );
                  })}
                </div>

                {listados.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-card-border p-4 text-center">
                    <p className="text-xs text-muted">Nenhum item neste filtro.</p>
                    <button
                      type="button"
                      onClick={() => setFiltro("todos")}
                      className="mt-1.5 text-[11px] font-medium text-primary hover:underline"
                    >
                      ver todos os {insights.length}
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {listados.map((ins) => {
                      const n = NIVEL[ins.nivel];
                      const Icone = n.icone;
                      const aberto = abertos[ins.id] ?? ins.nivel === "alerta";
                      return (
                        <li
                          key={ins.id}
                          className={cn(
                            "flex overflow-hidden rounded-xl border border-card-border",
                            aberto && n.fundo
                          )}
                        >
                          <span className={cn("w-0.5 shrink-0", n.regua)} />
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() =>
                                setAbertos((s) => ({ ...s, [ins.id]: !aberto }))
                              }
                              aria-expanded={aberto}
                              className="flex w-full items-start gap-2 px-2.5 py-2 text-left"
                            >
                              <Icone
                                className={cn("mt-0.5 size-3.5 shrink-0", n.cor)}
                                aria-label={n.label}
                              />
                              <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug">
                                {ins.titulo}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "mt-0.5 size-3.5 shrink-0 text-muted transition-transform",
                                  aberto && "rotate-180"
                                )}
                              />
                            </button>
                            {aberto && (
                              <div className="px-2.5 pb-2.5 pl-[26px]">
                                <p className="text-[13px] leading-relaxed text-foreground">
                                  {ins.explicacao}
                                </p>
                                {ins.conceitos && ins.conceitos.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {ins.conceitos.map((slug) => (
                                      <Link
                                        key={slug}
                                        href={`/conceitos/${slug}`}
                                        className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                                      >
                                        {slug.replace(/-/g, " ")} ↗
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </>
        )}

        {/* ——— Aba: Próximos passos (sugestões + revisão) ——— */}
        {aba === "proximos" && (
          <>
            {sugestoes.length === 0 ? (
              <p className="flex gap-2 rounded-xl border border-cat-criacional/40 bg-cat-criacional/8 p-4 text-xs leading-relaxed text-foreground">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-cat-criacional" />
                Nenhuma lacuna óbvia por aqui. Experimente simular falhas na visão
                Fluxo para testar a resiliência do que você montou.
              </p>
            ) : (
              sugestoes.map((s, i) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-card-border bg-card p-3"
                >
                  <p className="flex items-baseline gap-1.5 text-[13px] font-medium leading-snug">
                    <span className="text-[11px] tabular-nums text-muted">
                      {i + 1}.
                    </span>
                    {s.titulo}
                  </p>
                  <p className="mt-1 pl-[18px] text-xs leading-relaxed text-muted">
                    {s.porQue}
                  </p>
                  <Button
                    size="sm"
                    variant={i === 0 ? "primary" : "outline"}
                    className="mt-2.5 w-full"
                    onClick={() => onAplicarSugestao(s)}
                  >
                    <Plus /> {s.rotulo}
                  </Button>
                </div>
              ))
            )}

            {temCamadas && (
              <Secao
                titulo="Revisão do projeto"
                aberta={verRevisao}
                onToggle={() => setVerRevisao((v) => !v)}
              >
                <div className="space-y-3">
                  <p className="flex gap-2 text-xs leading-relaxed text-foreground">
                    <ClipboardCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {revisao.veredito}
                  </p>
                  {revisao.fortes.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-cat-criacional">
                        Pontos fortes ({revisao.fortes.length})
                      </p>
                      <ul className="mt-1 space-y-1">
                        {revisao.fortes.map((f) => (
                          <li
                            key={f}
                            className="text-[11px] leading-relaxed text-muted"
                          >
                            ✓ {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {revisao.riscos.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-cat-principio">
                        Riscos ({revisao.riscos.length})
                      </p>
                      <ul className="mt-1 space-y-1">
                        {revisao.riscos.map((r) => (
                          <li
                            key={r}
                            className="text-[11px] leading-relaxed text-muted"
                          >
                            ! {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {revisao.proximos.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Próximos passos
                      </p>
                      <ol className="mt-1 space-y-1">
                        {revisao.proximos.map((n, i) => (
                          <li
                            key={n}
                            className="text-[11px] leading-relaxed text-muted"
                          >
                            {i + 1}. {n}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </Secao>
            )}
          </>
        )}

        {/* ——— Aba: Modelos (templates) ——— */}
        {aba === "modelos" && (
          <>
            <p className="rounded-lg bg-muted/8 px-3 py-2 text-[11px] leading-relaxed text-muted">
              Carregar um modelo <b className="text-foreground">substitui</b> o
              projeto atual — a análise passa a narrar as escolhas dele.
            </p>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onTemplate(t.id);
                  setAba("analise");
                }}
                className="w-full rounded-xl border border-card-border bg-card p-3 text-left transition-colors hover:border-primary/60"
              >
                <span className="flex items-center gap-1.5 text-[13px] font-medium">
                  <Wand2 className="size-3.5 shrink-0 text-primary" />
                  {t.nome}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {t.descricao}
                </span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* ═══ Rodapé fixo ═══ */}
      {temCamadas && (
        <div className="shrink-0 space-y-2 border-t border-card-border pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onExportarADR}
            title="Baixa o projeto como Architecture Decision Record em Markdown"
          >
            <FileDown /> Exportar como ADR
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1" onClick={onCompartilhar}>
              <Share2 /> Compartilhar
            </Button>
            <Button variant="ghost" size="sm" className="flex-1" onClick={onLimpar}>
              <Trash2 /> Limpar
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
