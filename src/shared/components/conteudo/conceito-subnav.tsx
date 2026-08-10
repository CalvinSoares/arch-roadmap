"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/utils/cn";

export interface SecaoNav {
  id: string;
  titulo: string;
}

/**
 * Sub-navegação com scroll-spy: sticky lateral no desktop, chips horizontais
 * no mobile. Destaca a seção visível e rola suavemente ao clicar.
 */
export function ConceitoSubnav({ secoes }: { secoes: SecaoNav[] }) {
  const [ativa, setAtiva] = useState(secoes[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // a seção visível mais próxima do topo vence
        const visiveis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visiveis[0]) setAtiva(visiveis[0].target.id);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 }
    );
    secoes.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [secoes]);

  const irPara = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setAtiva(id);
  };

  return (
    <nav
      aria-label="Seções do conceito"
      className={cn(
        // mobile: chips horizontais roláveis; desktop: coluna sticky
        "sticky top-14 z-20 -mx-1 flex gap-1 overflow-x-auto bg-canvas/90 px-1 py-2 backdrop-blur",
        "lg:top-20 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
      )}
    >
      {secoes.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => irPara(s.id)}
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
            ativa === s.id
              ? "bg-primary/12 font-medium text-primary"
              : "text-muted hover:bg-muted/10 hover:text-foreground"
          )}
        >
          {s.titulo}
        </button>
      ))}
    </nav>
  );
}
