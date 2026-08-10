"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  Info,
  Trash2,
  Wand2,
  Share2,
  Unlink,
  FlaskConical,
  Gauge,
  Lightbulb,
  ChevronDown,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { cn } from "@/shared/utils/cn";
import { TEMPLATES } from "@/content/construtor/regras";
import type { Insight, ScoreProjeto } from "@/shared/types/construtor";
import type { UltimaAcao } from "../hook/construtor.hook";

const NIVEL = {
  sinergia: {
    icone: Sparkles,
    cor: "text-cat-criacional",
    borda: "border-cat-criacional/30 bg-cat-criacional/6",
    label: "Sinergia",
  },
  alerta: {
    icone: AlertTriangle,
    cor: "text-cat-principio",
    borda: "border-cat-principio/40 bg-cat-principio/8",
    label: "Alerta",
  },
  info: {
    icone: Info,
    cor: "text-cat-estrutural",
    borda: "border-cat-estrutural/30 bg-cat-estrutural/6",
    label: "Observação",
  },
} as const;

function BarraScore({
  label,
  valor,
  icone: Icone,
  invertida,
}: {
  label: string;
  valor: number;
  icone: LucideIcon;
  invertida?: boolean;
}) {
  const bom = invertida ? valor <= 55 : valor >= 55;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted">
          <Icone className="size-3.5" />
          {label}
        </span>
        <span className="font-medium">{valor}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-card-border">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            bom ? "bg-cat-criacional" : "bg-cat-principio"
          )}
          style={{ width: `${valor}%` }}
        />
      </div>
    </div>
  );
}

type Aba = "analise" | "leitura" | "modelos";

const ABAS: { id: Aba; label: string; icone: LucideIcon }[] = [
  { id: "analise", label: "Análise", icone: Lightbulb },
  { id: "leitura", label: "Leitura", icone: Gauge },
  { id: "modelos", label: "Modelos", icone: Wand2 },
];

interface Props {
  ultimaAcao: UltimaAcao | null;
  insights: Insight[];
  score: ScoreProjeto;
  temCamadas: boolean;
  onTemplate: (id: string) => void;
  onLimpar: () => void;
  onCompartilhar: () => void;
}

export function PainelAnalise({
  ultimaAcao,
  insights,
  score,
  temCamadas,
  onTemplate,
  onLimpar,
  onCompartilhar,
}: Props) {
  const [aba, setAba] = useState<Aba>("analise");

  const ordenados = [...insights].sort((a, b) => {
    const peso = { alerta: 0, sinergia: 1, info: 2 };
    return peso[a.nivel] - peso[b.nivel];
  });
  const alertas = insights.filter((i) => i.nivel === "alerta").length;

  return (
    <aside
      aria-label="Análise do projeto"
      className="space-y-3 lg:sticky lg:top-20 lg:self-start"
    >
      {/* Narração da última ação — sempre visível */}
      {ultimaAcao && (
        <div className="rounded-xl border border-primary/40 bg-primary/8 p-3.5">
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <MessageSquareText className="size-3.5 shrink-0" />
            {ultimaAcao.titulo}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-foreground">
            {ultimaAcao.descricao}
          </p>
          {ultimaAcao.bullets && ultimaAcao.bullets.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-primary/20 pt-2">
              {ultimaAcao.bullets.map((b) => (
                <li key={b} className="flex gap-1.5 text-[11px] leading-relaxed text-muted">
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-primary/60" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Abas */}
      <div
        role="tablist"
        aria-label="Painel de análise"
        className="grid grid-cols-3 overflow-hidden rounded-lg border border-card-border bg-card"
      >
        {ABAS.map(({ id, label, icone: Icone }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            onClick={() => setAba(id)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium transition-colors",
              aba === id
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:text-foreground"
            )}
          >
            <Icone className="size-3.5" />
            {label}
            {id === "analise" && alertas > 0 && (
              <span
                className={cn(
                  "absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold",
                  aba === id
                    ? "bg-primary-foreground text-primary"
                    : "bg-cat-principio text-background"
                )}
                title={`${alertas} alerta(s)`}
              >
                {alertas}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ——— Aba: Análise (insights em acordeão) ——— */}
      {aba === "analise" && (
        <div className="space-y-2">
          {ordenados.length === 0 ? (
            <p className="rounded-xl border border-dashed border-card-border p-4 text-center text-xs leading-relaxed text-muted">
              Monte o projeto (ou carregue um modelo) e as consequências de
              cada escolha aparecem aqui.
            </p>
          ) : (
            ordenados.map((ins) => {
              const n = NIVEL[ins.nivel];
              const Icone = n.icone;
              return (
                <details
                  key={ins.id}
                  open={ins.nivel === "alerta"}
                  className={cn("group rounded-xl border", n.borda)}
                >
                  <summary
                    className={cn(
                      "flex cursor-pointer list-none items-center gap-1.5 p-3 text-sm font-medium [&::-webkit-details-marker]:hidden",
                      n.cor
                    )}
                  >
                    <Icone className="size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1">{ins.titulo}</span>
                    <ChevronDown className="size-4 shrink-0 opacity-60 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-3 pb-3">
                    <p className="text-xs leading-relaxed text-foreground">
                      {ins.explicacao}
                    </p>
                    {ins.conceitos && ins.conceitos.length > 0 && (
                      <p className="mt-1.5 flex flex-wrap gap-2">
                        {ins.conceitos.map((slug) => (
                          <Link
                            key={slug}
                            href={`/conceitos/${slug}`}
                            className="text-[11px] font-medium text-primary hover:underline"
                          >
                            ver conceito: {slug} ↗
                          </Link>
                        ))}
                      </p>
                    )}
                  </div>
                </details>
              );
            })
          )}
        </div>
      )}

      {/* ——— Aba: Leitura (score) ——— */}
      {aba === "leitura" &&
        (temCamadas ? (
          <div className="space-y-3 rounded-xl border border-card-border bg-card p-4">
            <BarraScore label="Desacoplamento" valor={score.desacoplamento} icone={Unlink} />
            <BarraScore label="Testabilidade" valor={score.testabilidade} icone={FlaskConical} />
            <BarraScore label="Complexidade" valor={score.complexidade} icone={Gauge} invertida />
            {score.fatores.length > 0 && (
              <details className="group border-t border-card-border pt-2">
                <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                  Como esse número foi montado ({score.fatores.length} fatores)
                </summary>
                <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-muted">
                  {score.fatores.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-card-border p-4 text-center text-xs leading-relaxed text-muted">
            Adicione camadas para o projeto ganhar uma leitura de
            desacoplamento, testabilidade e complexidade.
          </p>
        ))}

      {/* ——— Aba: Modelos (templates) ——— */}
      {aba === "modelos" && (
        <div className="space-y-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onTemplate(t.id);
                setAba("analise");
              }}
              className="group w-full rounded-xl border border-card-border bg-card p-3 text-left transition-colors hover:border-primary/60"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Wand2 className="size-3.5 text-primary" />
                {t.nome}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                {t.descricao}
              </span>
            </button>
          ))}
          <p className="px-1 text-[11px] leading-relaxed text-muted">
            Carregar um modelo substitui o projeto atual — a análise narra as
            escolhas dele.
          </p>
        </div>
      )}

      {/* Ações — fixas, fora das abas */}
      {temCamadas && (
        <div className="flex gap-2 border-t border-card-border pt-3">
          <Button variant="outline" size="sm" className="flex-1" onClick={onCompartilhar}>
            <Share2 /> Compartilhar
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={onLimpar}>
            <Trash2 /> Limpar
          </Button>
        </div>
      )}
    </aside>
  );
}
