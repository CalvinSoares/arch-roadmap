"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ContentErrorState } from "@/shared/components/app/content-error-state";
import { Expandivel } from "@/shared/components/conteudo/expandivel";
import { ZoomPanSurface } from "@/shared/components/conteudo/zoom-pan-surface";
import { useContentError } from "@/shared/hook/use-content-error";
import { cn } from "@/shared/utils/cn";

/**
 * Renderiza um diagrama Mermaid (classe/sequência) theme-aware.
 * Mermaid é pesado → carregado via import dinâmico só quando montado.
 * No mobile o SVG encolhe com max-w-full; Expandir abre com zoom/pan.
 */
export function DiagramaClasse({ source }: { source: string }) {
  return (
    <Expandivel
      titulo="Diagrama"
      descricao="Use +/− ou pinçe para dar zoom; arraste para mover."
      expandido={<DiagramaClasseInner source={source} expandido />}
      bodyClassName="flex min-h-0 flex-col overflow-hidden p-3 sm:p-4"
    >
      <DiagramaClasseInner source={source} />
    </Expandivel>
  );
}

/** Mermaid coloca max-width:100% no SVG — isso mata o tamanho natural no expand. */
function liberarSvg(root: HTMLElement) {
  const svg = root.querySelector("svg");
  if (!svg) return;
  svg.style.maxWidth = "none";
  svg.style.height = "auto";
  const vb = svg.viewBox?.baseVal;
  if (vb && vb.width > 0) {
    svg.setAttribute("width", String(vb.width));
    svg.removeAttribute("height");
  }
}

function DiagramaClasseInner({
  source,
  expandido = false,
}: {
  source: string;
  expandido?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const { log } = useContentError();

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: resolvedTheme === "dark" ? "dark" : "neutral",
          fontFamily: "inherit",
        });
        const { svg } = await mermaid.render(`mmd-${rawId}`, source);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          if (expandido) liberarSvg(containerRef.current);
          setFailed(false);
        }
      } catch (error) {
        if (!cancelled) {
          setFailed(true);
          log(error, "diagrama-classe");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [source, resolvedTheme, rawId, log, expandido]);

  if (failed) {
    return (
      <div className="space-y-3">
        <ContentErrorState hint="diagrama-falhou" />
        <pre className="overflow-x-auto rounded-xl border border-card-border bg-canvas p-4 text-xs text-muted">
          <code>{source}</code>
        </pre>
      </div>
    );
  }

  const diagrama = (
    <div
      ref={containerRef}
      className={cn(
        "mermaid flex justify-center",
        expandido
          ? "[&_svg]:h-auto [&_svg]:max-w-none [&_svg]:w-auto"
          : "[&_svg]:max-w-full"
      )}
    />
  );

  if (expandido) {
    return (
      <figure className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-card-border bg-card">
        <figcaption className="shrink-0 border-b border-card-border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Diagrama de classes
        </figcaption>
        <ZoomPanSurface className="min-h-0 flex-1" initialZoom={1.1}>
          {diagrama}
        </ZoomPanSurface>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-card-border bg-card">
      <figcaption className="border-b border-card-border px-4 py-2.5 pr-24 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted sm:pr-28">
        Diagrama de classes
      </figcaption>
      <div
        tabIndex={0}
        role="img"
        aria-label="Diagrama de classes do conceito"
        className="overflow-x-auto overscroll-x-contain touch-pan-x p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-5"
      >
        {diagrama}
      </div>
    </figure>
  );
}
