"use client";

import { useCallback, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const MIN = 0.5;
const MAX = 3;
const STEP = 0.25;

/**
 * Superfície de zoom + pan para diagramas (Mermaid, fluxos largos).
 * Botões, pinch, Ctrl+roda e arraste.
 */
export function ZoomPanSurface({
  children,
  className,
  initialZoom = 1,
}: {
  children: React.ReactNode;
  className?: string;
  initialZoom?: number;
}) {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const clampZoom = (z: number) => Math.min(MAX, Math.max(MIN, z));

  const zoomBy = useCallback((delta: number) => {
    setZoom((z) => clampZoom(Math.round((z + delta) * 100) / 100));
  }, []);

  const reset = useCallback(() => {
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
  }, [initialZoom]);

  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -STEP : STEP);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    setPan({
      x: d.originX + (e.clientX - d.startX),
      y: d.originY + (e.clientY - d.startY),
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      setDragging(false);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      dragRef.current = null;
      setDragging(false);
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { dist, zoom };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const next = clampZoom(
        pinchRef.current.zoom * (dist / pinchRef.current.dist)
      );
      setZoom(Math.round(next * 100) / 100);
    }
  };

  const onTouchEnd = () => {
    pinchRef.current = null;
  };

  const pct = Math.round(zoom * 100);

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-xl border border-card-border bg-card/95 p-1 shadow-sm backdrop-blur-sm">
        <button
          type="button"
          aria-label="Diminuir zoom"
          disabled={zoom <= MIN}
          onClick={() => zoomBy(-STEP)}
          className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-30"
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-12 text-center font-mono text-[11px] tabular-nums text-muted">
          {pct}%
        </span>
        <button
          type="button"
          aria-label="Aumentar zoom"
          disabled={zoom >= MAX}
          onClick={() => zoomBy(STEP)}
          className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-30"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Resetar zoom"
          onClick={reset}
          className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      <div
        role="region"
        aria-label={`Diagrama com zoom ${pct}% — arraste para mover, pinçe ou use os botões`}
        tabIndex={0}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={cn(
          "min-h-[50dvh] flex-1 cursor-grab overflow-hidden overscroll-contain rounded-xl",
          "bg-canvas/40 touch-none active:cursor-grabbing",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        )}
      >
        <div
          className="flex h-full w-full items-center justify-center p-6"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: dragging ? undefined : "transform 120ms ease-out",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
