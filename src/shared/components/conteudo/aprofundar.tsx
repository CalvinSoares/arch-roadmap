"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils/cn";

/**
 * Progressive disclosure: o resumo fica sempre visível; o conteúdo extenso
 * abre sob demanda com animação de altura (grid-rows, sem medição de DOM).
 */
export function Aprofundar({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="mt-3">
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 rounded-xl border border-card-border bg-canvas/60 p-4 text-[15px] leading-relaxed">
            {children}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ChevronDown
          className={cn("size-4 transition-transform duration-300", aberto && "rotate-180")}
        />
        {aberto ? "Recolher" : "Aprofundar"}
      </button>
    </div>
  );
}
