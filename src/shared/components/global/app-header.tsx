"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Menu, Search, PanelLeft } from "lucide-react";
import { ThemeToggle } from "@/shared/components/global/theme-toggle";
import { useSidebar } from "@/shared/context/sidebar-context";
import { useSearchPalette } from "@/shared/context/search-context";
import { cn } from "@/shared/utils/cn";

/**
 * Header sticky colapsável: recolhe ao rolar para baixo e reaparece ao
 * subir (transição fluida).
 */
export function AppHeader() {
  const [oculto, setOculto] = useState(false);
  const ultimoY = useRef(0);
  const { setMobileOpen, collapsed, toggleCollapsed } = useSidebar();
  const { setOpen } = useSearchPalette();

  useEffect(() => {
    const aoRolar = () => {
      const y = window.scrollY;
      setOculto(y > ultimoY.current && y > 72);
      ultimoY.current = y;
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-card-border bg-canvas/80 px-4 backdrop-blur transition-transform duration-300 lg:px-8",
        oculto && "-translate-y-full"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="hidden rounded-md p-1.5 text-muted hover:bg-muted/10 hover:text-foreground lg:block"
        >
          <PanelLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="rounded-md p-1.5 text-muted hover:bg-muted/10 hover:text-foreground lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <BookOpen className="size-5 text-primary" />
          <span className="font-semibold">DevAtlas</span>
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buscar"
          className="rounded-md p-2 text-muted hover:bg-muted/10 hover:text-foreground"
        >
          <Search className="size-4" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
