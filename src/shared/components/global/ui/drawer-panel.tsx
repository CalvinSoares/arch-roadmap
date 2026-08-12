"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

/**
 * Painel lateral full-height (mobile = quase tela cheia).
 * Usado pela ficha de tech e pelo detalhe do roadmap.
 */
export function DrawerPanel({
  label,
  onClose,
  children,
  header,
  footer,
  className,
}: {
  label: string;
  onClose: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col",
          "border-l border-card-border bg-card shadow-2xl",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-card-border p-4 sm:p-5">
          <div className="min-w-0 flex-1">{header}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-card-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 sm:pb-5">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
