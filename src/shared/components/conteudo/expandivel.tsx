"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/global/ui/dialog";
import { Button } from "@/shared/components/global/ui/button";
import { cn } from "@/shared/utils/cn";

/**
 * Embrulha ilustrações/diagramas com um atalho de expandir — no mobile o
 * conteúdo embutido costuma ficar pequeno demais; o dialog abre quase em
 * tela cheia com rolagem.
 */
export function Expandivel({
  titulo,
  descricao = "Role ou pinçe para ver os detalhes.",
  children,
  expandido,
  className,
  bodyClassName,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
  expandido: React.ReactNode;
  className?: string;
  /** Classes do corpo rolável (ex.: overflow-hidden p/ zoom interno). */
  bodyClassName?: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className={cn("relative min-w-0", className)}>
      {children}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-end p-2 sm:p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="pointer-events-auto h-10 gap-1.5 bg-card/95 px-3 shadow-sm backdrop-blur-sm sm:h-9"
          onClick={() => setAberto(true)}
        >
          <Maximize2 className="size-4" />
          <span className="max-[360px]:sr-only">Expandir</span>
        </Button>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent
          size="full"
          showClose
          className={cn(
            "flex flex-col gap-0 overflow-hidden p-0!",
            "max-sm:left-0 max-sm:top-0 max-sm:h-dvh max-sm:max-h-dvh",
            "max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0",
            "max-sm:rounded-none max-sm:border-0",
            "sm:h-[min(92dvh,920px)] sm:max-h-[min(92dvh,920px)]"
          )}
        >
          <div className="shrink-0 border-b border-card-border px-4 py-3.5 pr-14 pt-[max(0.875rem,env(safe-area-inset-top))] sm:px-5 sm:py-4 sm:pr-14 sm:pt-4">
            <DialogTitle className="text-base font-semibold tracking-tight">
              {titulo}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted">
              {descricao}
            </DialogDescription>
          </div>
          <div
            className={cn(
              "min-h-0 flex-1 overflow-auto overscroll-contain touch-pan-x touch-pan-y p-4 sm:p-6",
              bodyClassName
            )}
          >
            {aberto ? expandido : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
