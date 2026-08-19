"use client";

import Link from "next/link";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  X,
  ChevronUp,
  ChevronDown,
  MousePointerClick,
  ArrowDown,
  ArrowDownUp,
  User,
  HardDrive,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { cn } from "@/shared/utils/cn";
import { camadaDef, padraoDef } from "@/content/construtor/blocos";
import { tecnologiaDef } from "@/content/construtor/tecnologias";
import {
  CAMADA_VISUAL,
  CATEGORIA_TECH_VISUAL,
  iconeDoPadrao,
  iconeDaTech,
} from "@/shared/config/construtor-visual";
import type { CamadaNoProjeto, EstadoProjeto } from "@/shared/types/construtor";

/** bloco da paleta em arraste (padrão ou tecnologia); liga o destaque de alvo. */
export interface BlocoArrastado {
  tipo: "padrao" | "tech";
  id: string;
}

interface SlotProps {
  camada: CamadaNoProjeto;
  indice: number;
  total: number;
  arrastado: BlocoArrastado | null;
  onRemover: (camadaId: string) => void;
  onMover: (de: number, para: number) => void;
  onRemoverPadrao: (padraoId: string, camadaId: string) => void;
  onRemoverTech: (techId: string, camadaId: string) => void;
  onAbrirFicha: (techId: string) => void;
}

function CamadaSlot({
  camada,
  indice,
  total,
  arrastado,
  onRemover,
  onMover,
  onRemoverPadrao,
  onRemoverTech,
  onAbrirFicha,
}: SlotProps) {
  const def = camadaDef(camada.camadaId);
  const { attributes, listeners, setNodeRef, transform, transition, isOver, isDragging } =
    useSortable({
      id: `camada:${camada.camadaId}`,
      data: { tipo: "camada-canvas", id: camada.camadaId, nome: def?.nome },
    });

  if (!def) return null;
  const visual = CAMADA_VISUAL[camada.camadaId];
  const Icone = visual?.icon ?? HardDrive;

  const alvoRecomendado = arrastado
    ? arrastado.tipo === "padrao"
      ? !!padraoDef(arrastado.id)?.aplicaEm.includes(camada.camadaId)
      : !!tecnologiaDef(arrastado.id)?.viveEm.includes(camada.camadaId)
    : false;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative rounded-xl border-2 bg-card p-3 transition-all",
        visual?.border ?? "border-card-border",
        isDragging && "opacity-50",
        // arrastando um bloco: alvos recomendados brilham; hover confirma
        arrastado && alvoRecomendado && "ring-2 ring-cat-criacional/60",
        arrastado && !alvoRecomendado && "opacity-70",
        isOver && arrastado && "border-primary bg-primary/8 opacity-100"
      )}
    >
      {arrastado && alvoRecomendado && (
        <span className="absolute -top-2.5 right-3 flex items-center gap-1 rounded-full bg-cat-criacional px-2 py-0.5 text-[10px] font-semibold text-background">
          <Sparkles className="size-3" /> recomendado
        </span>
      )}

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label={`Arrastar ${def.nome}`}
          {...listeners}
          {...attributes}
          className="cursor-grab touch-none text-muted hover:text-foreground"
        >
          <GripVertical className="size-4" />
        </button>

        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            visual?.bg ?? "bg-muted/12"
          )}
        >
          <Icone className={cn("size-4.5", visual?.text ?? "text-muted")} strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{def.nome}</p>
          <p className="truncate text-xs text-muted">{def.descricao}</p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label="Mover para cima"
            disabled={indice === 0}
            onClick={() => onMover(indice, indice - 1)}
            className="rounded p-1 text-muted hover:bg-muted/10 hover:text-foreground disabled:opacity-30"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Mover para baixo"
            disabled={indice === total - 1}
            onClick={() => onMover(indice, indice + 1)}
            className="rounded p-1 text-muted hover:bg-muted/10 hover:text-foreground disabled:opacity-30"
          >
            <ChevronDown className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Remover ${def.nome}`}
            onClick={() => onRemover(camada.camadaId)}
            className="rounded p-1 text-muted hover:bg-cat-arquitetura/12 hover:text-cat-arquitetura"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {camada.tecnologias.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-dashed border-card-border pt-2.5">
          {camada.tecnologias.map((tid) => {
            const t = tecnologiaDef(tid);
            if (!t) return null;
            const IconeT = iconeDaTech(tid);
            const cat = CATEGORIA_TECH_VISUAL[t.categoria];
            return (
              <span
                key={tid}
                className={cn(
                  "flex items-center gap-1.5 rounded-md py-1 pl-2 pr-1 text-xs font-medium",
                  cat.bg,
                  cat.text
                )}
              >
                <IconeT className="size-3.5" strokeWidth={2} />
                <button
                  type="button"
                  onClick={() => onAbrirFicha(tid)}
                  title={`Abrir ficha de ${t.nome}`}
                  className="hover:underline"
                >
                  {t.nome}
                </button>
                <button
                  type="button"
                  aria-label={`Remover ${t.nome}`}
                  onClick={() => onRemoverTech(tid, camada.camadaId)}
                  className="rounded p-0.5 hover:bg-background/40"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {camada.padroes.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-dashed border-card-border pt-2.5">
          {camada.padroes.map((pid) => {
            const p = padraoDef(pid);
            if (!p) return null;
            const IconeP = iconeDoPadrao(pid);
            return (
              <span
                key={pid}
                className="flex items-center gap-1.5 rounded-full bg-primary/12 py-1 pl-2.5 pr-1 text-xs font-medium text-primary"
              >
                <IconeP className="size-3.5" strokeWidth={2} />
                <Link href={`/conceitos/${pid}`} className="hover:underline">
                  {p.nome}
                </Link>
                <button
                  type="button"
                  aria-label={`Remover ${p.nome}`}
                  onClick={() => onRemoverPadrao(pid, camada.camadaId)}
                  className="rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Conector do fluxo: linha + seta indicando o sentido da requisição. */
function Conector() {
  return (
    <div aria-hidden className="flex flex-col items-center py-0.5 text-muted/70">
      <span className="h-2 w-px bg-card-border" />
      <ArrowDown className="size-3.5" />
    </div>
  );
}

function Extremo({
  icone: Icone,
  label,
}: {
  icone: typeof User;
  label: string;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted">
      <Icone className="size-3.5" />
      {label}
    </div>
  );
}

interface CanvasProps {
  estado: EstadoProjeto;
  arrastado: BlocoArrastado | null;
  foraDeOrdem: boolean;
  onRemover: (camadaId: string) => void;
  onMover: (de: number, para: number) => void;
  onRemoverPadrao: (padraoId: string, camadaId: string) => void;
  onRemoverTech: (techId: string, camadaId: string) => void;
  onAbrirFicha: (techId: string) => void;
  onOrganizar: () => void;
}

export function CanvasProjeto({
  estado,
  arrastado,
  foraDeOrdem,
  onRemover,
  onMover,
  onRemoverPadrao,
  onRemoverTech,
  onAbrirFicha,
  onOrganizar,
}: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[420px] rounded-xl border-2 border-dashed p-4 transition-colors",
        isOver ? "border-primary/60 bg-primary/4" : "border-card-border bg-canvas/50"
      )}
    >
      {foraDeOrdem && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-cat-principio/40 bg-cat-principio/8 p-2.5">
          <ArrowDownUp className="size-4 shrink-0 text-cat-principio" />
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-foreground">
            A pilha está fora da ordem do fluxo (usuário → infraestrutura).
          </p>
          <Button size="sm" variant="outline" onClick={onOrganizar}>
            <ArrowDownUp /> Organizar ordem
          </Button>
        </div>
      )}
      {estado.camadas.length === 0 ? (
        <div className="flex h-full min-h-[380px] flex-col items-center justify-center gap-2 text-center">
          <MousePointerClick className="size-8 text-muted" />
          <p className="font-medium">Seu projeto começa aqui</p>
          <p className="max-w-xs text-sm text-muted">
            Arraste camadas da paleta (ou toque em +) e empilhe sua
            arquitetura de cima para baixo.
          </p>
        </div>
      ) : (
        <SortableContext
          items={estado.camadas.map((c) => `camada:${c.camadaId}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col">
            <Extremo icone={User} label="usuário" />
            <Conector />
            {estado.camadas.map((c, i) => (
              <div key={c.camadaId} className="flex flex-col">
                {i > 0 && <Conector />}
                <CamadaSlot
                  camada={c}
                  indice={i}
                  total={estado.camadas.length}
                  arrastado={arrastado}
                  onRemover={onRemover}
                  onMover={onMover}
                  onRemoverPadrao={onRemoverPadrao}
                  onRemoverTech={onRemoverTech}
                  onAbrirFicha={onAbrirFicha}
                />
              </div>
            ))}
            <Conector />
            <Extremo icone={HardDrive} label="infraestrutura" />
          </div>
        </SortableContext>
      )}
    </div>
  );
}
