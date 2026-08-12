"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TipoConector = "espinha" | "ramo" | "ramo-opcional" | "prereq";

export interface ConnectorLink {
  id: string;
  /** id do nó de origem (tópico). */
  de: string;
  /** id do nó de destino (card ou próximo tópico). */
  para: string;
  tipo: TipoConector;
}

export interface ConnectorPath {
  id: string;
  d: string;
  tipo: TipoConector;
}

/**
 * Mede as âncoras dos nós registrados e devolve paths SVG que ligam cada
 * tópico aos seus cards (curva tracejada) e tópicos entre si (espinha).
 * Recalcula em resize do container e após as fontes carregarem.
 */
export function useConnectorLayout(links: ConnectorLink[]) {
  /**
   * Ref por callback: guardar o elemento em estado faz o observer ser
   * reinstalado quando o container é remontado (ex.: entrar/sair da tela
   * cheia) — com `useRef` o ResizeObserver seguia observando o nó antigo e
   * as linhas ficavam com a geometria da visão anterior.
   */
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    setContainer(el);
  }, []);
  const nodesRef = useRef(new Map<string, HTMLElement>());
  const [paths, setPaths] = useState<ConnectorPath[]>([]);

  const registerNode = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) nodesRef.current.set(id, el);
      else nodesRef.current.delete(id);
    },
    []
  );

  const medir = useCallback(() => {
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const novos: ConnectorPath[] = [];

    for (const link of links) {
      const origem = nodesRef.current.get(link.de);
      const destino = nodesRef.current.get(link.para);
      if (!origem || !destino) continue;
      const a = origem.getBoundingClientRect();
      const b = destino.getBoundingClientRect();

      if (link.tipo === "espinha") {
        // centro-baixo do tópico → centro-topo do próximo tópico
        const x1 = a.left + a.width / 2 - cr.left;
        const y1 = a.bottom - cr.top;
        const x2 = b.left + b.width / 2 - cr.left;
        const y2 = b.top - cr.top;
        const dy = Math.max(12, (y2 - y1) * 0.4);
        novos.push({
          id: link.id,
          tipo: link.tipo,
          d: `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`,
        });
      } else if (link.tipo === "prereq") {
        // item → item: curva suave entre centros (grafo de dependência)
        const x1 = a.left + a.width / 2 - cr.left;
        const y1 = a.top + a.height / 2 - cr.top;
        const x2 = b.left + b.width / 2 - cr.left;
        const y2 = b.top + b.height / 2 - cr.top;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const ox = (-dy / len) * 28;
        const oy = (dx / len) * 28;
        novos.push({
          id: link.id,
          tipo: link.tipo,
          d: `M ${x1} ${y1} Q ${mx + ox} ${my + oy} ${x2} ${y2}`,
        });
      } else {
        // lateral do tópico → borda interna do card (curva que segue o card)
        const centroTopico = a.left + a.width / 2;
        const centroCard = b.left + b.width / 2;
        const paraEsquerda = centroCard < centroTopico;
        const x1 = (paraEsquerda ? a.left : a.right) - cr.left;
        const y1 = a.top + a.height / 2 - cr.top;
        const x2 = (paraEsquerda ? b.right : b.left) - cr.left;
        const y2 = b.top + b.height / 2 - cr.top;
        const dx = (x2 - x1) * 0.45;
        novos.push({
          id: link.id,
          tipo: link.tipo,
          d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
        });
      }
    }
    setPaths(novos);
  }, [links, container]);

  useEffect(() => {
    if (!container) return;
    // mede após o layout assentar (evita geometria da visão anterior)
    const quadro = requestAnimationFrame(() => medir());

    const ro = new ResizeObserver(() => medir());
    ro.observe(container);
    // nós mudam de tamanho independentemente do container (chips, textos)
    for (const el of nodesRef.current.values()) ro.observe(el);
    window.addEventListener("resize", medir);
    // reflow tardio de fontes muda as larguras dos cards
    document.fonts?.ready.then(() => medir()).catch(() => {});

    return () => {
      cancelAnimationFrame(quadro);
      ro.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [medir, container]);

  return { containerRef, registerNode, paths };
}
