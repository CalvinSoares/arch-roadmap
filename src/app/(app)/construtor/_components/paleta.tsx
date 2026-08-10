"use client";

import { useDraggable } from "@dnd-kit/core";
import { Plus, Layers, Puzzle, GripVertical, Cpu, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { CAMADAS_DEF, PADROES_DEF } from "@/content/construtor/blocos";
import { TECNOLOGIAS_DEF } from "@/content/construtor/tecnologias";
import {
  CAMADA_VISUAL,
  CATEGORIA_TECH_VISUAL,
  iconeDoPadrao,
  iconeDaTech,
} from "@/shared/config/construtor-visual";
import type { EstadoProjeto } from "@/shared/types/construtor";

interface ItemProps {
  dragId: string;
  nome: string;
  descricao: string;
  icone: LucideIcon;
  /** classes de cor do ícone (acento da camada) — padrões usam muted. */
  iconeClasse?: string;
  iconeFundo?: string;
  desabilitado?: boolean;
  onAdd: () => void;
  data: Record<string, unknown>;
}

function ItemPaleta({
  dragId,
  nome,
  descricao,
  icone: Icone,
  iconeClasse,
  iconeFundo,
  desabilitado,
  onAdd,
  data,
}: ItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data,
    disabled: desabilitado,
  });

  return (
    <div
      ref={setNodeRef}
      title={desabilitado ? `${nome} já está no projeto` : descricao}
      aria-disabled={desabilitado}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 text-sm transition-colors",
        desabilitado
          ? "border-dashed border-card-border"
          : "border-card-border hover:border-primary/60",
        isDragging && "opacity-40"
      )}
    >
      <button
        type="button"
        aria-label={`Arrastar ${nome}`}
        {...listeners}
        {...attributes}
        disabled={desabilitado}
        className="-mr-1 cursor-grab touch-none text-muted/70 hover:text-foreground disabled:cursor-default"
      >
        <GripVertical className="size-4" />
      </button>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md",
          iconeFundo ?? "bg-muted/10",
          desabilitado && "opacity-50"
        )}
      >
        <Icone className={cn("size-4", iconeClasse ?? "text-muted")} strokeWidth={1.8} />
      </span>
      <span className={cn("min-w-0 flex-1 truncate", desabilitado && "text-muted")}>
        {nome}
      </span>
      <button
        type="button"
        aria-label={`Adicionar ${nome}`}
        onClick={onAdd}
        disabled={desabilitado}
        className="rounded-md p-1 text-muted transition-colors hover:bg-primary/12 hover:text-primary disabled:cursor-default"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

interface PaletaProps {
  estado: EstadoProjeto;
  onAddCamada: (camadaId: string) => void;
  onAddPadrao: (padraoId: string) => void;
  onAddTech: (techId: string) => void;
}

export function Paleta({ estado, onAddCamada, onAddPadrao, onAddTech }: PaletaProps) {
  return (
    <aside
      aria-label="Paleta de blocos"
      className="space-y-5 lg:sticky lg:top-20 lg:self-start"
    >
      <section>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          <Layers className="size-3.5" /> Camadas
        </p>
        <div className="space-y-1.5">
          {CAMADAS_DEF.map((c) => {
            const v = CAMADA_VISUAL[c.id];
            return (
              <ItemPaleta
                key={c.id}
                dragId={`pal-camada:${c.id}`}
                data={{ tipo: "pal-camada", id: c.id, nome: c.nome }}
                nome={c.nome}
                descricao={c.descricao}
                icone={v?.icon ?? Layers}
                iconeClasse={v?.text}
                iconeFundo={v?.bg}
                desabilitado={estado.camadas.some((x) => x.camadaId === c.id)}
                onAdd={() => onAddCamada(c.id)}
              />
            );
          })}
        </div>
      </section>

      <section>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          <Puzzle className="size-3.5" /> Padrões
        </p>
        <div className="space-y-1.5">
          {PADROES_DEF.map((p) => (
            <ItemPaleta
              key={p.id}
              dragId={`pal-padrao:${p.id}`}
              data={{ tipo: "pal-padrao", id: p.id, nome: p.nome }}
              nome={p.nome}
              descricao={`${p.descricao} (solte sobre uma camada)`}
              icone={iconeDoPadrao(p.id)}
              onAdd={() => onAddPadrao(p.id)}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          Arraste um padrão para dentro de uma camada — as recomendadas se
          acendem. Ou toque em + para aplicar direto na camada típica.
        </p>
      </section>

      <section>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          <Cpu className="size-3.5" /> Tecnologias
        </p>
        <div className="space-y-1.5">
          {TECNOLOGIAS_DEF.map((t) => {
            const cat = CATEGORIA_TECH_VISUAL[t.categoria];
            return (
              <ItemPaleta
                key={t.id}
                dragId={`pal-tech:${t.id}`}
                data={{ tipo: "pal-tech", id: t.id, nome: t.nome }}
                nome={t.nome}
                descricao={`${t.descricao} Vive em: ${t.viveEm.join(", ")}.`}
                icone={iconeDaTech(t.id)}
                iconeClasse={cat.text}
                iconeFundo={cat.bg}
                onAdd={() => onAddTech(t.id)}
              />
            );
          })}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          Solte a tecnologia na camada onde ela vive — e clique no chip para
          abrir a ficha completa (specs, usos e alternativas).
        </p>
      </section>
    </aside>
  );
}
