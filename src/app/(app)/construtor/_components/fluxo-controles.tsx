"use client";

import { useState } from "react";
import {
  Play,
  RotateCcw,
  Flame,
  Snowflake,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  Database,
  Inbox,
  Gauge,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { cn } from "@/shared/utils/cn";
import {
  LABEL_TIPO,
  type Falhas,
  type Simulacao,
  type TipoRequisicao,
} from "../utils/simulador";

const TIPOS: TipoRequisicao[] = ["leitura", "escrita", "busca", "upload"];
const VELOCIDADES = [0.5, 1, 2] as const;
export type Velocidade = (typeof VELOCIDADES)[number];

interface Props {
  sim: Simulacao;
  tipo: TipoRequisicao;
  onTipo: (t: TipoRequisicao) => void;
  cacheQuente: boolean;
  onCacheQuente: (v: boolean) => void;
  falhas: Falhas;
  onFalhas: (f: Falhas) => void;
  velocidade: Velocidade;
  onVelocidade: (v: Velocidade) => void;
  rodando: boolean;
  passoAtual: number;
  totalPassos: number;
  onEnviar: () => void;
  onLimpar: () => void;
  onPasso: (delta: number) => void;
}

function Chip({
  ativo,
  onClick,
  children,
  title,
  tom = "primary",
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  tom?: "primary" | "perigo" | "quente";
}) {
  const tons = {
    primary: "border-primary/60 bg-primary/12 text-primary",
    perigo: "border-cat-arquitetura/60 bg-cat-arquitetura/12 text-cat-arquitetura",
    quente: "border-cat-principio/60 bg-cat-principio/12 text-cat-principio",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={ativo}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        ativo ? tons[tom] : "border-card-border text-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function FluxoControles({
  sim,
  tipo,
  onTipo,
  cacheQuente,
  onCacheQuente,
  falhas,
  onFalhas,
  velocidade,
  onVelocidade,
  rodando,
  passoAtual,
  totalPassos,
  onEnviar,
  onLimpar,
  onPasso,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const iniciado = passoAtual >= 0;

  const quantasFalhas = [
    falhas.cache && sim.disponivel.cache,
    falhas.banco && sim.disponivel.banco,
    falhas.fila && sim.disponivel.fila,
  ].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-card-border bg-card">
      {/* Barra principal — sempre visível e numa única linha */}
      <div className="flex flex-wrap items-center gap-2 p-2.5">
        <Button size="sm" onClick={onEnviar} disabled={rodando}>
          <Play /> {rodando ? "Percorrendo…" : iniciado ? "Rodar de novo" : "Enviar requisição"}
        </Button>

        {iniciado && (
          <div className="flex items-center gap-0.5 rounded-lg border border-card-border">
            <button
              type="button"
              aria-label="Passo anterior"
              onClick={() => onPasso(-1)}
              disabled={passoAtual <= 0}
              className="flex size-10 items-center justify-center rounded-l-lg text-muted hover:bg-muted/10 hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-12 text-center text-[11px] tabular-nums text-muted">
              {passoAtual + 1}/{totalPassos}
            </span>
            <button
              type="button"
              aria-label="Próximo passo"
              onClick={() => onPasso(1)}
              disabled={passoAtual >= totalPassos - 1}
              className="flex size-10 items-center justify-center rounded-r-lg text-muted hover:bg-muted/10 hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 text-muted" title="Velocidade da animação">
          <Gauge className="size-3.5 shrink-0" />
          {VELOCIDADES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onVelocidade(v)}
              className={cn(
                "min-h-9 min-w-9 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
                velocidade === v ? "bg-primary/12 text-primary" : "hover:text-foreground"
              )}
            >
              {v}×
            </button>
          ))}
        </div>

        {/* Resumo da configuração + toggle */}
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className={cn(
            "flex min-h-10 w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors sm:ml-auto sm:w-auto",
            aberto
              ? "border-primary/50 bg-primary/8 text-primary"
              : "border-card-border text-muted hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          <span className="text-foreground">{LABEL_TIPO[tipo]}</span>
          {tipo === "leitura" && sim.disponivel.cache && (
            <span className="flex items-center gap-1 text-cat-principio">
              {cacheQuente ? <Flame className="size-3" /> : <Snowflake className="size-3" />}
              {cacheQuente ? "quente" : "frio"}
            </span>
          )}
          {quantasFalhas > 0 && (
            <span className="flex items-center gap-1 text-cat-arquitetura">
              <TriangleAlert className="size-3" />
              {quantasFalhas} fora
            </span>
          )}
          <ChevronDown
            className={cn("size-3.5 transition-transform", aberto && "rotate-180")}
          />
        </button>

        {iniciado && !rodando && (
          <Button variant="ghost" size="sm" onClick={onLimpar}>
            <RotateCcw /> Limpar
          </Button>
        )}
      </div>

      {/* Painel de ajustes — colapsado por padrão */}
      {aberto && (
        <div className="space-y-2.5 border-t border-card-border p-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Requisição
            </span>
            {TIPOS.map((t) => (
              <Chip key={t} ativo={tipo === t} onClick={() => onTipo(t)}>
                {LABEL_TIPO[t]}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Condições
            </span>

            {sim.disponivel.cache && tipo === "leitura" && (
              <Chip
                ativo={cacheQuente}
                tom="quente"
                onClick={() => onCacheQuente(!cacheQuente)}
                title="Alterne entre cache quente (HIT) e frio (MISS)"
              >
                {cacheQuente ? <Flame className="size-3.5" /> : <Snowflake className="size-3.5" />}
                {cacheQuente ? "Cache quente" : "Cache frio"}
              </Chip>
            )}
            {sim.disponivel.cache && (
              <Chip
                ativo={falhas.cache}
                tom="perigo"
                onClick={() => onFalhas({ ...falhas, cache: !falhas.cache })}
                title="Simular queda do cache"
              >
                <Zap className="size-3.5" /> Derrubar cache
              </Chip>
            )}
            {sim.disponivel.banco && (
              <Chip
                ativo={falhas.banco}
                tom="perigo"
                onClick={() => onFalhas({ ...falhas, banco: !falhas.banco })}
                title="Simular queda do banco"
              >
                <Database className="size-3.5" /> Derrubar banco
              </Chip>
            )}
            {sim.disponivel.fila && (
              <Chip
                ativo={falhas.fila}
                tom="perigo"
                onClick={() => onFalhas({ ...falhas, fila: !falhas.fila })}
                title="Simular queda da fila/broker"
              >
                <Inbox className="size-3.5" /> Derrubar fila
              </Chip>
            )}
            {quantasFalhas > 0 && (
              <button
                type="button"
                onClick={() => onFalhas({ cache: false, banco: false, fila: false })}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                restaurar tudo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
