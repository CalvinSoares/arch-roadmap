"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RotateCcw, Check } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { Badge } from "@/shared/components/global/ui/badge";
import { DrawerPanel } from "@/shared/components/global/ui/drawer-panel";
import { cn } from "@/shared/utils/cn";
import { CATEGORIAS, DIFICULDADES } from "@/shared/config/categorias";
import { getConceito } from "@/shared/lib/content";
import { useRoadmapProgress } from "@/shared/hook/use-roadmap-progress";
import {
  useConnectorLayout,
  type ConnectorLink,
} from "@/shared/hook/use-connector-layout";
import type {
  Roadmap,
  RoadmapItem,
  RecursoRoadmap,
} from "@/shared/types/roadmap";
import { StatusCheck, statusClasses } from "./roadmap-node-box";

interface Selecionado {
  id: string;
  titulo: string;
  conceito?: string;
  descricao?: string;
  contexto?: string;
  recursos?: RecursoRoadmap[];
  prerequisitos?: { id: string; titulo: string }[];
}

const ROTULO_RECURSO: Record<RecursoRoadmap["tipo"], string> = {
  doc: "doc",
  artigo: "artigo",
  spec: "spec",
  video: "vídeo",
  curso: "curso",
  ferramenta: "ferramenta",
};

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
  prereq: {
    stroke: "var(--acento, var(--primary))",
    strokeWidth: 1.75,
    dash: "2 6",
    opacity: 0.7,
  },
} as const;

export function RoadmapFlow({ roadmap }: { roadmap: Roadmap }) {
  const router = useRouter();
  const [sel, setSel] = useState<Selecionado | null>(null);
  const [soEssencial, setSoEssencial] = useState(false);

  const porId = useMemo(() => {
    const m = new Map<string, RoadmapItem>();
    for (const s of roadmap.sections) {
      for (const it of s.items) m.set(it.id, it);
    }
    return m;
  }, [roadmap.sections]);

  const temEssencial = useMemo(
    () => roadmap.sections.some((s) => s.items.some((it) => it.essencial)),
    [roadmap.sections]
  );

  const total = useMemo(
    () => roadmap.sections.reduce((acc, s) => acc + 1 + s.items.length, 0),
    [roadmap.sections]
  );
  const { statusDe, ciclar, definir, resetar, contagem } = useRoadmapProgress(
    roadmap.slug,
    total
  );

  const links = useMemo<ConnectorLink[]>(() => {
    const l: ConnectorLink[] = [];
    const visivel = (it: RoadmapItem) => !soEssencial || it.essencial === true;

    roadmap.sections.forEach((s, i) => {
      if (i > 0) {
        l.push({
          id: `espinha-${i}`,
          de: roadmap.sections[i - 1].id,
          para: s.id,
          tipo: "espinha",
        });
      }
      s.items.filter(visivel).forEach((it) => {
        l.push({
          id: `ramo-${it.id}`,
          de: s.id,
          para: it.id,
          tipo: it.opcional ? "ramo-opcional" : "ramo",
        });
        for (const pre of it.prerequisitos ?? []) {
          const origem = porId.get(pre);
          if (!origem || !visivel(origem)) continue;
          l.push({
            id: `prereq-${pre}-${it.id}`,
            de: pre,
            para: it.id,
            tipo: "prereq",
          });
        }
      });
    });
    return l;
  }, [roadmap, soEssencial, porId]);

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
      recursos: item.recursos,
      prerequisitos: (item.prerequisitos ?? [])
        .map((id) => {
          const pre = porId.get(id);
          return pre ? { id, titulo: pre.titulo } : null;
        })
        .filter((x): x is { id: string; titulo: string } => x !== null),
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-card-border">
            <div
              className="h-full rounded-full bg-cat-criacional transition-all"
              style={{ width: `${contagem.pct}%` }}
            />
          </div>
          <span className="text-sm text-muted">
            {contagem.concluidos}/{contagem.total} concluídos
          </span>
          {temEssencial && (
            <Button
              variant={soEssencial ? "subtle" : "ghost"}
              size="sm"
              onClick={() => setSoEssencial((v) => !v)}
              aria-pressed={soEssencial}
            >
              {soEssencial ? "Mostrar tudo" : "Só o essencial"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            {LEGENDA.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted">
                <span className={`size-2.5 rounded-full ${l.cor}`} />
                {l.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <span
                className="size-2.5 rounded-full border border-dashed border-[var(--acento,var(--primary))]"
                style={{ opacity: 0.7 }}
              />
              Pré-requisito
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={resetar}>
            <RotateCcw /> Zerar
          </Button>
        </div>
      </div>

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
            const itens = soEssencial
              ? s.items.filter((it) => it.essencial)
              : s.items;
            const esquerda = itens.filter((_, j) => j % 2 === 1);
            const direita = itens.filter((_, j) => j % 2 === 0);

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

                <div
                  className={cn(
                    "flex flex-col gap-2.5 lg:order-1 lg:items-end",
                    "ml-3 border-l-2 border-dashed border-card-border pl-4 lg:ml-0 lg:border-0 lg:pl-0",
                    esquerda.length === 0 && "hidden lg:flex"
                  )}
                >
                  {esquerda.map((it) => renderItem(it, "esquerda"))}
                </div>

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
        onAbrirItem={(id) => {
          const item = porId.get(id);
          if (!item) return;
          const secao = roadmap.sections.find((s) =>
            s.items.some((it) => it.id === id)
          );
          abrirItem(item, secao?.titulo ?? "");
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
  onAbrirItem,
}: {
  sel: Selecionado | null;
  onClose: () => void;
  statusDe: (id: string) => string;
  onToggleDone: (id: string) => void;
  onAbrir: (slug: string) => void;
  onAbrirItem: (id: string) => void;
}) {
  if (!sel) return null;
  const conceito = sel.conceito ? getConceito(sel.conceito) : undefined;
  const cat = conceito ? CATEGORIAS[conceito.categoria] : null;
  const feito = statusDe(sel.id) === "done";

  return (
    <DrawerPanel
      label="Detalhes do tópico"
      onClose={onClose}
      header={
        <div className="min-w-0">
          {sel.contexto && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {sel.contexto}
            </p>
          )}
          <h2 className="mt-0.5 text-lg font-semibold sm:text-xl">{sel.titulo}</h2>
          {cat && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className={cat.badge}>{cat.label}</Badge>
              <span className="text-xs text-muted">
                {DIFICULDADES[conceito!.dificuldade]} · {conceito!.tempoLeitura}{" "}
                min
              </span>
            </div>
          )}
        </div>
      }
      footer={
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            variant={feito ? "subtle" : "outline"}
            onClick={() => onToggleDone(sel.id)}
            className="h-12 w-full shrink-0 sm:flex-1"
          >
            <Check className={feito ? "text-cat-criacional" : ""} />
            {feito ? "Concluído" : "Marcar como concluído"}
          </Button>
          {conceito && (
            <Button
              size="lg"
              className="h-12 w-full shrink-0 sm:flex-1"
              onClick={() => onAbrir(conceito.slug)}
            >
              Abrir conceito <ArrowUpRight />
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-sm leading-relaxed text-foreground">
        {conceito ? (
          <p>{conceito.resumo}</p>
        ) : sel.descricao ? (
          <p>{sel.descricao}</p>
        ) : sel.recursos?.length ? null : (
          <p className="text-muted">
            Conteúdo detalhado deste tópico chega em breve.
          </p>
        )}

        {sel.prerequisitos && sel.prerequisitos.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              O que preciso antes
            </p>
            <ul className="mt-2 space-y-1.5">
              {sel.prerequisitos.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onAbrirItem(p.id)}
                    className="w-full rounded-lg border border-card-border px-3 py-2.5 text-left transition-colors hover:border-primary/60"
                  >
                    <span className="font-medium">{p.titulo}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sel.recursos && sel.recursos.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              Recursos
            </p>
            <ul className="mt-2 space-y-1.5">
              {sel.recursos.map((r) => (
                <li key={r.href}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2 rounded-lg border border-card-border px-3 py-2.5 transition-colors hover:border-primary/60"
                  >
                    <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted transition-colors group-hover:text-primary" />
                    <span className="min-w-0">
                      <span className="font-medium">{r.titulo}</span>
                      <span className="ml-1.5 text-[11px] text-muted">
                        {r.fonte ? `${r.fonte} · ` : ""}
                        {ROTULO_RECURSO[r.tipo]}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DrawerPanel>
  );
}
