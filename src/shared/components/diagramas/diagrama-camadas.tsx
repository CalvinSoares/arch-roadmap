"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { useMontado } from "@/shared/hook/use-montado";
import {
  ReactFlow,
  Background,
  Controls,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Camada } from "@/shared/types/conceito";
import { Expandivel } from "@/shared/components/conteudo/expandivel";
import { cn } from "@/shared/utils/cn";

const NODE_W = 280;
const NODE_H = 64;

/** Handles pré-definidos (topo=target, base=source); dispensa medição de DOM. */
const HANDLES = [
  {
    id: null,
    type: "target" as const,
    position: Position.Top,
    x: NODE_W / 2,
    y: 0,
    width: 1,
    height: 1,
  },
  {
    id: null,
    type: "source" as const,
    position: Position.Bottom,
    x: NODE_W / 2,
    y: NODE_H,
    width: 1,
    height: 1,
  },
];

/**
 * Visualização em camadas (UI → Domínio → Infra), com a peça onde o
 * conceito atua em destaque. React Flow em modo estático (não-controlado).
 */
export function DiagramaCamadas({ camadas }: { camadas: Camada[] }) {
  return (
    <Expandivel
      titulo="Camadas"
      descricao="Onde o conceito se encaixa na pilha. Role ou pinçe no diagrama."
      expandido={<CamadasCanvas camadas={camadas} expandido />}
    >
      <CamadasCanvas camadas={camadas} />
    </Expandivel>
  );
}

function CamadasCanvas({
  camadas,
  expandido = false,
}: {
  camadas: Camada[];
  expandido?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useMontado();

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = camadas.map((c, i) => ({
      id: c.id,
      position: { x: 0, y: i * 120 },
      data: { label: c.titulo },
      draggable: false,
      width: NODE_W,
      height: NODE_H,
      measured: { width: NODE_W, height: NODE_H },
      handles: HANDLES,
      style: {
        width: NODE_W,
        borderRadius: 12,
        border: c.destaque
          ? "2px solid var(--primary)"
          : "1px solid var(--card-border)",
        background: c.destaque
          ? "color-mix(in srgb, var(--primary) 12%, var(--card))"
          : "var(--card)",
        color: "var(--foreground)",
        padding: "14px 16px",
        fontSize: 14,
        fontWeight: c.destaque ? 600 : 400,
      },
    }));

    const edges: Edge[] = camadas.slice(1).map((c, i) => ({
      id: `${camadas[i].id}->${c.id}`,
      source: camadas[i].id,
      target: c.id,
      animated: c.destaque || camadas[i].destaque,
      style: { stroke: "var(--muted)", strokeWidth: 1.5 },
    }));

    return { nodes, edges };
  }, [camadas]);

  const shell = cn(
    "overflow-hidden rounded-xl border border-card-border",
    expandido ? "h-[min(70dvh,560px)]" : "h-[min(55dvh,360px)] sm:h-[440px]"
  );

  if (!mounted) {
    return <div className={cn(shell, "bg-canvas")} />;
  }

  return (
    <div className={shell}>
      <ReactFlow
        defaultNodes={nodes}
        defaultEdges={edges}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} color="var(--card-border)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
