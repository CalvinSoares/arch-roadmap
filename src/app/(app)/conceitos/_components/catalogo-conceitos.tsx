"use client";

import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Search, Clock, X, SearchX, RotateCcw } from "lucide-react";
import { Badge } from "@/shared/components/global/ui/badge";
import { SpotlightCard } from "@/shared/components/global/ui/spotlight-card";
import { SeloNovo } from "@/shared/components/global/ui/selo-novo";
import { CATEGORIAS, DIFICULDADES } from "@/shared/config/categorias";
import { cn } from "@/shared/utils/cn";
import type { Conceito } from "@/shared/types/conceito";
import { useCatalogo } from "../hook/catalogo.hook";
import {
  OPCOES_CATEGORIA,
  OPCOES_DIFICULDADE,
  COR_DIFICULDADE,
  type FiltroCategoria,
  type FiltroDificuldade,
} from "../utils/catalogo.utils";

const MOLA = { type: "spring" as const, stiffness: 420, damping: 34 };

/** "todas" usa o primário; o resto herda a cor do próprio valor. */
function corDaCategoria(value: FiltroCategoria) {
  return value === "todas" ? "var(--primary)" : CATEGORIAS[value].cssVar;
}
function corDaDificuldade(value: FiltroDificuldade) {
  return value === "todas" ? "var(--primary)" : COR_DIFICULDADE[value];
}

/* ------------------------------------------------------------------ */

interface GrupoProps<T extends string> {
  rotulo: string;
  opcoes: { value: T; label: string }[];
  valor: T;
  aoEscolher: (v: T) => void;
  corDe: (v: T) => string;
  /** Precisa ser único: é o que faz o realce deslizar só dentro do grupo. */
  idRealce: string;
}

function GrupoFiltro<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
  corDe,
  idRealce,
}: GrupoProps<T>) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:w-20">
        {rotulo}
      </span>
      <LayoutGroup id={idRealce}>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={rotulo}>
          {opcoes.map((op) => {
            const ativo = valor === op.value;
            return (
              <button
                key={op.value}
                type="button"
                onClick={() => aoEscolher(op.value)}
                aria-pressed={ativo}
                style={{ ["--acento" as string]: corDe(op.value) }}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-[13px] font-medium outline-none",
                  "transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring",
                  ativo
                    ? "text-[var(--acento)]"
                    : "text-muted hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                {ativo && (
                  <motion.span
                    layoutId={`realce-${idRealce}`}
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    transition={MOLA}
                    style={{
                      background: "color-mix(in srgb, var(--acento) 14%, transparent)",
                      boxShadow:
                        "inset 0 0 0 1px color-mix(in srgb, var(--acento) 38%, transparent)",
                    }}
                  />
                )}
                <span className="relative z-10">{op.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface Props {
  conceitos: Conceito[];
  /** Slugs que estrearam na janela recente (resolvido no servidor). */
  novos?: string[];
}

export function CatalogoConceitos({ conceitos, novos = [] }: Props) {
  const {
    categoria,
    setCategoria,
    dificuldade,
    setDificuldade,
    busca,
    setBusca,
    resultado,
    temFiltro,
    limpar,
  } = useCatalogo(conceitos);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Filtros                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-4 rounded-2xl border border-card-border bg-card/50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="group relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, tag…"
              aria-label="Buscar conceitos"
              className={cn(
                "h-11 w-full rounded-xl border border-card-border bg-card pl-10 pr-9 text-sm outline-none",
                "transition-all duration-300 placeholder:text-muted",
                "focus-visible:border-primary/50 focus-visible:shadow-[var(--shadow-md)]"
              )}
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <p
              aria-live="polite"
              className="text-[13px] tabular-nums text-muted"
            >
              <span className="font-semibold text-foreground">
                {resultado.length}
              </span>{" "}
              de {conceitos.length}
            </p>
            {temFiltro && (
              <button
                type="button"
                onClick={limpar}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="size-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 border-t border-card-border pt-4">
          <GrupoFiltro
            rotulo="Categoria"
            opcoes={OPCOES_CATEGORIA}
            valor={categoria}
            aoEscolher={setCategoria}
            corDe={corDaCategoria}
            idRealce="categoria"
          />
          <GrupoFiltro
            rotulo="Nível"
            opcoes={OPCOES_DIFICULDADE}
            valor={dificuldade}
            aoEscolher={setDificuldade}
            corDe={corDaDificuldade}
            idRealce="dificuldade"
          />
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Resultado                                                         */}
      {/* ---------------------------------------------------------------- */}
      {resultado.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-card-border py-16 text-center"
        >
          <SearchX className="size-7 text-muted" />
          <p className="text-sm text-muted">
            Nenhum conceito bate com esses filtros.
          </p>
          <button
            type="button"
            onClick={limpar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:border-primary/45 hover:text-primary"
          >
            <RotateCcw className="size-3.5" />
            Limpar filtros
          </button>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {resultado.map((c, i) => {
              const cat = CATEGORIAS[c.categoria];
              const corNivel = COR_DIFICULDADE[c.dificuldade];
              return (
                <motion.div
                  key={c.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{
                    duration: 0.32,
                    delay: Math.min(i, 8) * 0.035,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link href={`/conceitos/${c.slug}`} className="block h-full">
                    <SpotlightCard cor={cat.cssVar} className="flex h-full flex-col p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Badge className={cat.badge}>{cat.label}</Badge>
                          {novos.includes(c.slug) && <SeloNovo />}
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                          <Clock className="size-3" /> {c.tempoLeitura} min
                        </span>
                      </div>
                      {/* h2: a lista é filha direta do h1 da página, sem
                          agrupamento intermediário; h3 pulava um nível. */}
                      <h2 className="mt-3.5 font-semibold tracking-tight">
                        {c.titulo}
                      </h2>
                      <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
                        {c.resumo}
                      </p>
                      {/* nível na cor da rampa (mesma do filtro) */}
                      <div className="mt-4 flex items-center gap-2 border-t border-card-border pt-3 text-xs">
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full"
                          style={{ background: corNivel }}
                        />
                        <span
                          className="font-medium"
                          style={{ color: corNivel }}
                        >
                          {DIFICULDADES[c.dificuldade]}
                        </span>
                      </div>
                    </SpotlightCard>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
