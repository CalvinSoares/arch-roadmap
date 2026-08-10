"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RotateCcw, X, Check } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { Badge } from "@/shared/components/global/ui/badge";
import { cn } from "@/shared/utils/cn";
import { CATEGORIAS, DIFICULDADES } from "@/shared/config/categorias";
import { getConceito } from "@/shared/lib/content";
import { useRoadmapProgress } from "@/shared/hook/use-roadmap-progress";
import {
  useConnectorLayout,
  type ConnectorLink,
} from "@/shared/hook/use-connector-layout";
import type { Roadmap, RoadmapItem } from "@/shared/types/roadmap";
import { StatusCheck, statusClasses } from "./roadmap-node-box";

interface Selecionado {
  id: string;
  titulo: string;
  conceito?: string;
  descricao?: string;
  contexto?: string;
}

const LEGENDA = [
  { cor: "bg-cat-criacional", label: "Concluído" },
  { cor: "bg-cat-principio", label: "Em progresso" },
  { cor: "bg-muted", label: "Pulado" },
  { cor: "bg-card-border", label: "Pendente" },
];

const ESTILO_CONECTOR = {
  espinha: { stroke: "var(--card-border)", strokeWidth: 2.5, dash: undefined, opacity: 1 },
  ramo: { stroke: "var(--muted)", strokeWidth: 1.5, dash: "5 5", opacity: 0.55 },
  "ramo-opcional": { stroke: "var(--muted)", strokeWidth: 1.5, dash: "3 5", opacity: 0.35 },
} as const;

export function RoadmapFlow({ roadmap }: { roadmap: Roadmap }) {
  const router = useRouter();
  const [sel, setSel] = useState<Selecionado | null>(null);

  const total = useMemo(
    () => roadmap.sections.reduce((acc, s) => acc + 1 + s.items.length, 0),
    [roadmap.sections]
  );
  const { statusDe, ciclar, definir, resetar, contagem } = useRoadmapProgress(
    roadmap.slug,
    total
  );

  // Links: espinha entre tópicos consecutivos + um ramo por item
  const links = useMemo<ConnectorLink[]>(() => {
    const l: ConnectorLink[] = [];
    roadmap.sections.forEach((s, i) => {
      if (i > 0) {
        l.push({
          id: `espinha-${i}`,
          de: roadmap.sections[i - 1].id,
          para: s.id,
          tipo: "espinha",
        });
      }
      s.items.forEach((it) =>
        l.push({
          id: `ramo-${it.id}`,
          de: s.id,
          para: it.id,
          tipo: it.opcional ? "ramo-opcional" : "ramo",
        })
      );
    });
    return l;
  }, [roadmap]);

  const { containerRef, registerNode, paths } = useConnectorLayout(links);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSel(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const abrirItem = (item: RoadmapItem, contexto: string) =>
    setSel({
      id: item.id,
      titulo: item.titulo,
      conceito: item.conceito,
      descricao: item.descricao,
      contexto,
    });

  return (
    <div className="space-y-4">
      {/* Barra de progresso + legenda */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-card-border">
            <div
              className="h-full rounded-full bg-cat-criacional transition-all"
              style={{ width: `${contagem.pct}%` }}
            />
          </div>
          <span className="text-sm text-muted">
            {contagem.concluidos}/{contagem.total} concluídos
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            {LEGENDA.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted">
                <span className={`size-2.5 rounded-full ${l.cor}`} />
                {l.label}
              </span>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={resetar}>
            <RotateCcw /> Zerar
          </Button>
        </div>
      </div>

      {/* Mapa com conectores */}
      <div ref={containerRef} className="relative pb-6">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        >
          {paths.map((p) => {
            const e = ESTILO_CONECTOR[p.tipo];
            return (
              <path
                key={p.id}
                d={p.d}
                fill="none"
                stroke={e.stroke}
                strokeWidth={e.strokeWidth}
                strokeDasharray={e.dash}
                opacity={e.opacity}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        <div className="flex flex-col gap-8 lg:gap-16">
          {roadmap.sections.map((s, i) => {
            const stTopic = statusDe(s.id);
            const esquerda = s.items.filter((_, j) => j % 2 === 1);
            const direita = s.items.filter((_, j) => j % 2 === 0);

            const renderItem = (it: RoadmapItem, lado: "esquerda" | "direita") => {
              const st = statusDe(it.id);
              return (
                <div
                  key={it.id}
                  ref={registerNode(it.id)}
                  className={cn(
                    "group relative flex w-fit items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:border-primary",
                    lado === "esquerda" ? "lg:self-end" : "lg:self-start",
                    it.opcional && "border-dashed",
                    statusClasses(st)
                  )}
                >
                  <StatusCheck progresso={st} onToggle={() => ciclar(it.id)} />
                  {/* overlay: toda a área do card abre o drawer, sem aninhar botões */}
                  <button
                    type="button"
                    onClick={() => abrirItem(it, s.titulo)}
                    className="titulo text-left after:absolute after:inset-0 after:content-['']"
                  >
                    {it.titulo}
                  </button>
                  {it.conceito && (
                    <ArrowUpRight className="size-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </div>
              );
            };

            return (
              <div
                key={s.id}
                className="flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-x-12"
              >
                {/* Tópico (espinha central) */}
                <div className="flex lg:order-2 lg:justify-center">
                  <div
                    ref={registerNode(s.id)}
                    className={cn(
                      "relative z-10 flex items-center gap-2.5 rounded-xl border-2 px-5 py-3 text-base font-semibold shadow-sm transition-colors",
                      "border-primary/60 bg-primary/12 hover:border-primary",
                      statusClasses(stTopic)
                    )}
                  >
                    <StatusCheck progresso={stTopic} onToggle={() => ciclar(s.id)} />
                    <button
                      type="button"
                      onClick={() =>
                        setSel({
                          id: s.id,
                          titulo: s.titulo,
                          conceito: s.conceito,
                          descricao: s.descricao,
                        })
                      }
                      className="titulo text-left after:absolute after:inset-0 after:content-['']"
                    >
                      <span className="mr-1 text-primary/70">{i + 1}.</span>
                      {s.titulo}
                    </button>
                  </div>
                </div>

                {/* Itens à esquerda (desktop) / trilho (mobile) */}
                <div
                  className={cn(
                    "flex flex-col gap-2.5 lg:order-1 lg:items-end",
                    "ml-3 border-l-2 border-dashed border-card-border pl-4 lg:ml-0 lg:border-0 lg:pl-0",
                    esquerda.length === 0 && "hidden lg:flex"
                  )}
                >
                  {esquerda.map((it) => renderItem(it, "esquerda"))}
                </div>

                {/* Itens à direita */}
                <div
                  className={cn(
                    "flex flex-col gap-2.5 lg:order-3 lg:items-start",
                    "ml-3 border-l-2 border-dashed border-card-border pl-4 lg:ml-0 lg:border-0 lg:pl-0",
                    direita.length === 0 && "hidden lg:flex"
                  )}
                >
                  {direita.map((it) => renderItem(it, "direita"))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DetalheDrawer
        sel={sel}
        onClose={() => setSel(null)}
        statusDe={statusDe}
        onToggleDone={(id) => definir(id, statusDe(id) === "done" ? "pending" : "done")}
        onAbrir={(slug) => {
          setSel(null);
          router.push(`/conceitos/${slug}`);
        }}
      />
    </div>
  );
}

function DetalheDrawer({
  sel,
  onClose,
  statusDe,
  onToggleDone,
  onAbrir,
}: {
  sel: Selecionado | null;
  onClose: () => void;
  statusDe: (id: string) => string;
  onToggleDone: (id: string) => void;
  onAbrir: (slug: string) => void;
}) {
  if (!sel) return null;
  const conceito = sel.conceito ? getConceito(sel.conceito) : undefined;
  const cat = conceito ? CATEGORIAS[conceito.categoria] : null;
  const feito = statusDe(sel.id) === "done";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside
        aria-label="Detalhes do tópico"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-card-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-card-border p-5">
          <div>
            {sel.contexto && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {sel.contexto}
              </p>
            )}
            <h2 className="mt-0.5 text-xl font-semibold">{sel.titulo}</h2>
            {cat && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={cat.badge}>{cat.label}</Badge>
                <span className="text-xs text-muted">
                  {DIFICULDADES[conceito!.dificuldade]} · {conceito!.tempoLeitura} min
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-muted hover:bg-muted/10"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 text-sm leading-relaxed text-foreground">
          {conceito ? (
            <p>{conceito.resumo}</p>
          ) : sel.descricao ? (
            <p>{sel.descricao}</p>
          ) : (
            <p className="text-muted">Conteúdo detalhado deste tópico chega em breve.</p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-card-border p-5">
          <Button
            variant={feito ? "subtle" : "outline"}
            onClick={() => onToggleDone(sel.id)}
            className="flex-1"
          >
            <Check className={feito ? "text-cat-criacional" : ""} />
            {feito ? "Concluído" : "Marcar como concluído"}
          </Button>
          {conceito && (
            <Button className="flex-1" onClick={() => onAbrir(conceito.slug)}>
              Abrir conceito <ArrowUpRight />
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
