"use client";

import { useMemo } from "react";
import { Lock, Check, Circle } from "lucide-react";
import type { Roadmap } from "@/shared/types/roadmap";
import { useRoadmapProgress } from "@/shared/hook/use-roadmap-progress";
import { montarMapaDeFases } from "@/shared/lib/gamificacao/fases";
import { cn } from "@/shared/utils/cn";

/**
 * Mapa de fases: as seções do roadmap como uma trilha com desbloqueio. Lê o
 * mesmo progresso do `RoadmapFlow` (localStorage, espelhado na conta quando
 * logado), então os dois ficam sempre em sincronia; aqui é só a leitura de
 * jogo por cima. Fase bloqueada mostra o cadeado; a atual, o quanto falta.
 */
export function MapaDeFases({ roadmap }: { roadmap: Roadmap }) {
  const totalNos = useMemo(
    () => roadmap.sections.reduce((n, s) => n + s.items.length, 0),
    [roadmap]
  );
  const { statusDe } = useRoadmapProgress(roadmap.slug, totalNos);

  const fases = useMemo(
    () => montarMapaDeFases(roadmap.sections, statusDe),
    [roadmap, statusDe]
  );

  return (
    <ol className="space-y-2">
      {fases.map((f, i) => {
        const pct = f.total > 0 ? Math.round((f.concluidos / f.total) * 100) : 0;
        const estado = f.concluida
          ? "concluida"
          : f.desbloqueada
            ? "aberta"
            : "bloqueada";

        return (
          <li
            key={f.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 transition-colors",
              estado === "concluida" && "border-primary/40 bg-primary/5",
              estado === "aberta" && "border-card-border bg-card",
              estado === "bloqueada" && "border-card-border bg-card/40 opacity-60"
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold",
                estado === "concluida" && "bg-primary text-primary-foreground",
                estado === "aberta" && "bg-primary/15 text-primary",
                estado === "bloqueada" && "bg-foreground/10 text-muted"
              )}
            >
              {estado === "concluida" ? (
                <Check className="size-4" />
              ) : estado === "bloqueada" ? (
                <Lock className="size-3.5" />
              ) : (
                i + 1
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {f.titulo}
              </p>
              {estado !== "bloqueada" && f.total > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[12px] tabular-nums text-muted">
                    {f.concluidos}/{f.total}
                  </span>
                </div>
              )}
              {estado === "bloqueada" && (
                <p className="text-[12px] text-muted">
                  Conclua a fase anterior para desbloquear
                </p>
              )}
            </div>

            {estado === "aberta" && !f.concluida && f.concluidos === 0 && (
              <Circle className="size-4 shrink-0 text-muted" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
