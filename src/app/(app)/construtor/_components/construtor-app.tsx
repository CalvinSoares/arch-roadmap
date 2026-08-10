"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { padraoDef } from "@/content/construtor/blocos";
import { tecnologiaDef } from "@/content/construtor/tecnologias";
import {
  CAMADA_VISUAL,
  iconeDoPadrao,
  iconeDaTech,
} from "@/shared/config/construtor-visual";
import { Icone } from "@/shared/components/global/icone";
import { cn } from "@/shared/utils/cn";
import type { CamadaId } from "@/shared/types/construtor";
import { Hammer, Waypoints } from "lucide-react";
import { useConstrutor } from "../hook/construtor.hook";
import { Paleta } from "./paleta";
import { CanvasProjeto, type BlocoArrastado } from "./canvas-projeto";
import { PainelAnalise } from "./painel-analise";
import { FichaTecnologia } from "./ficha-tecnologia";
import { FluxoProjeto } from "./fluxo-projeto";

interface DragInfo {
  tipo: "pal-camada" | "pal-padrao" | "pal-tech" | "camada-canvas";
  id: string;
  nome: string;
}

/** Ícone do bloco arrastado (camada com acento; padrão/tech com o próprio ícone). */
function OverlayIcone({ drag }: { drag: DragInfo }) {
  if (drag.tipo === "pal-padrao")
    return <Icone de={iconeDoPadrao(drag.id)} className="size-4 text-primary" />;

  if (drag.tipo === "pal-tech")
    return <Icone de={iconeDaTech(drag.id)} className="size-4 text-primary" />;

  const v = CAMADA_VISUAL[drag.id];
  if (!v) return null;
  return <Icone de={v.icon} className={cn("size-4", v.text)} />;
}

export function ConstrutorApp() {
  const c = useConstrutor();
  const [drag, setDrag] = useState<DragInfo | null>(null);
  const [fichaTech, setFichaTech] = useState<string | null>(null);
  const [visao, setVisao] = useState<"montar" | "fluxo">("montar");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (e: DragStartEvent) => {
    setDrag((e.active.data.current as DragInfo) ?? null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const info = e.active.data.current as DragInfo | undefined;
    const overId = e.over?.id as string | undefined;
    setDrag(null);
    if (!info || !overId) return;

    const indiceDe = (id: string) =>
      c.estado.camadas.findIndex((x) => `camada:${x.camadaId}` === id);

    if (info.tipo === "pal-camada") {
      // soltar no canvas (fim) ou sobre uma camada (naquela posição)
      const idx = overId.startsWith("camada:") ? indiceDe(overId) : undefined;
      c.adicionarCamada(info.id as CamadaId, idx === -1 ? undefined : idx);
      return;
    }

    if (info.tipo === "pal-padrao") {
      if (overId.startsWith("camada:")) {
        c.aplicarPadrao(info.id, overId.slice("camada:".length));
      } else {
        toast.info("Solte o padrão sobre uma camada do projeto.");
      }
      return;
    }

    if (info.tipo === "pal-tech") {
      if (overId.startsWith("camada:")) {
        c.aplicarTecnologia(info.id, overId.slice("camada:".length));
      } else {
        toast.info("Solte a tecnologia sobre uma camada do projeto.");
      }
      return;
    }

    if (info.tipo === "camada-canvas" && overId.startsWith("camada:")) {
      const de = indiceDe(`camada:${info.id}`);
      const para = indiceDe(overId);
      if (de !== -1 && para !== -1 && de !== para) c.moverCamada(de, para);
    }
  };

  /** Fallback sem drag: aplica na primeira camada recomendada presente. */
  const addPadraoPorToque = (padraoId: string) => {
    const def = padraoDef(padraoId);
    if (!def) return;
    const alvo = c.estado.camadas.find((x) =>
      def.aplicaEm.includes(x.camadaId)
    );
    if (alvo) {
      c.aplicarPadrao(padraoId, alvo.camadaId);
    } else {
      toast.info(
        `Adicione antes uma destas camadas: ${def.aplicaEm.join(", ")}.`
      );
    }
  };

  const addTechPorToque = (techId: string) => {
    const def = tecnologiaDef(techId);
    if (!def) return;
    const alvo = c.estado.camadas.find((x) => def.viveEm.includes(x.camadaId));
    if (alvo) {
      c.aplicarTecnologia(techId, alvo.camadaId);
    } else {
      toast.info(`Adicione antes uma destas camadas: ${def.viveEm.join(", ")}.`);
    }
  };

  const arrastado: BlocoArrastado | null =
    drag?.tipo === "pal-padrao"
      ? { tipo: "padrao", id: drag.id }
      : drag?.tipo === "pal-tech"
        ? { tipo: "tech", id: drag.id }
        : null;

  return (
    <DndContext
      id="construtor-dnd"
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDrag(null)}
    >
      <div
        className={cn(
          "grid gap-5",
          visao === "montar"
            ? "lg:grid-cols-[230px_minmax(0,1fr)_330px] xl:grid-cols-[250px_minmax(0,1fr)_370px]"
            : "lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_370px]"
        )}
      >
        {visao === "montar" && (
          <Paleta
            estado={c.estado}
            onAddCamada={(id) => c.adicionarCamada(id as CamadaId)}
            onAddPadrao={addPadraoPorToque}
            onAddTech={addTechPorToque}
          />
        )}

        <div className="min-w-0 space-y-3">
          <div
            role="tablist"
            aria-label="Visão do construtor"
            className="inline-flex overflow-hidden rounded-lg border border-card-border bg-card"
          >
            <button
              type="button"
              role="tab"
              aria-selected={visao === "montar"}
              onClick={() => setVisao("montar")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors",
                visao === "montar"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Hammer className="size-4" /> Montar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={visao === "fluxo"}
              onClick={() => setVisao("fluxo")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors",
                visao === "fluxo"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Waypoints className="size-4" /> Fluxo
            </button>
          </div>

          {visao === "montar" ? (
            <CanvasProjeto
              estado={c.estado}
              arrastado={arrastado}
              foraDeOrdem={c.foraDeOrdem}
              onRemover={c.removerCamada}
              onMover={c.moverCamada}
              onRemoverPadrao={c.removerPadrao}
              onRemoverTech={c.removerTecnologia}
              onAbrirFicha={setFichaTech}
              onOrganizar={c.organizarOrdem}
            />
          ) : (
            <FluxoProjeto estado={c.estado} />
          )}
        </div>

        <PainelAnalise
          ultimaAcao={c.ultimaAcao}
          insights={c.insights}
          score={c.score}
          referencia={c.referencia}
          sugestoes={c.sugestoes}
          revisao={c.revisao}
          onAplicarSugestao={c.aplicarSugestao}
          temCamadas={c.estado.camadas.length > 0}
          onTemplate={c.carregarTemplate}
          onLimpar={c.limpar}
          onCompartilhar={c.compartilhar}
          onExportarADR={c.exportarADR}
        />
      </div>

      <DragOverlay>
        {drag && (
          <div className="flex items-center gap-2 rounded-lg border-2 border-primary bg-card px-3 py-2 text-sm font-medium shadow-lg">
            <OverlayIcone drag={drag} />
            {drag.nome}
          </div>
        )}
      </DragOverlay>

      <FichaTecnologia techId={fichaTech} onClose={() => setFichaTech(null)} />
    </DndContext>
  );
}
