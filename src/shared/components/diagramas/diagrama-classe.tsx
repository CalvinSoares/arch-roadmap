"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ContentErrorState } from "@/shared/components/app/content-error-state";
import { useContentError } from "@/shared/hook/use-content-error";

/**
 * Renderiza um diagrama Mermaid (classe/sequência) theme-aware.
 * Mermaid é pesado → carregado via import dinâmico só quando montado.
 */
export function DiagramaClasse({ source }: { source: string }) {
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
  }, [source, resolvedTheme, rawId, log]);

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

  return (
    <div
      tabIndex={0}
      role="img"
      aria-label="Diagrama do conceito"
      className="overflow-x-auto rounded-xl border border-card-border bg-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div ref={containerRef} className="mermaid flex justify-center [&_svg]:max-w-full" />
    </div>
  );
}
