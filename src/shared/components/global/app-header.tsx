"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Search, PanelLeft } from "lucide-react";
import { ThemeToggle } from "@/shared/components/global/theme-toggle";
import { useSidebar } from "@/shared/context/sidebar-context";
import { useSearchPalette } from "@/shared/context/search-context";
import { cn } from "@/shared/utils/cn";

/**
 * Header sticky colapsável: recolhe ao rolar para baixo e reaparece ao subir.
 * Ganha fundo/vidro conforme a página sai do topo e traz a barra de progresso
 * de leitura na borda inferior.
 */
export function AppHeader() {
  const [oculto, setOculto] = useState(false);
  const [noTopo, setNoTopo] = useState(true);
  const ultimoY = useRef(0);
  const { setMobileOpen, collapsed, toggleCollapsed } = useSidebar();
  const { setOpen } = useSearchPalette();

  useEffect(() => {
    const aoRolar = () => {
      const y = window.scrollY;
      setOculto(y > ultimoY.current && y > 72);
      setNoTopo(y < 8);
      ultimoY.current = y;
    };
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between gap-2 px-4 transition-[transform,background-color,box-shadow,backdrop-filter] duration-300 lg:px-8",
        noTopo
          ? "bg-transparent"
          : "bg-canvas/70 shadow-[var(--shadow-sm)] backdrop-blur-xl",
        oculto && "-translate-y-full"
      )}
    >
      {/* borda inferior discreta (some quando a página está no topo) */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-px bg-card-border transition-opacity duration-300",
          noTopo && "opacity-0"
        )}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="hidden rounded-lg p-2 text-muted transition-all duration-200 hover:bg-foreground/5 hover:text-primary active:scale-90 lg:block"
        >
          <PanelLeft
            className={cn(
              "size-[18px] transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="rounded-lg p-2 text-muted transition-all duration-200 hover:bg-foreground/5 hover:text-primary active:scale-90 lg:hidden"
        >
          <Menu className="size-[18px]" />
        </button>
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <span className="relative grid size-7 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-[var(--glow-c)]">
            <span className="absolute size-4 rounded-full border-[1.5px] border-primary-foreground/70" />
            <span className="absolute h-4 w-2 rounded-full border-[1.5px] border-primary-foreground/70" />
          </span>
          <span className="font-semibold tracking-tight">DevAtlas</span>
        </Link>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Busca — pílula que se expande no hover (desktop) */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buscar"
          className="group hidden items-center gap-2 rounded-full border border-card-border bg-card/60 py-1.5 pl-3 pr-2 text-sm text-muted transition-all duration-300 hover:border-primary/45 hover:bg-card hover:text-foreground hover:shadow-[var(--shadow-md)] sm:flex"
        >
          <Search className="size-4 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[7rem] group-hover:opacity-100">
            Buscar…
          </span>
          <kbd className="rounded border border-card-border bg-background px-1.5 py-0.5 text-[10px] font-semibold transition-colors group-hover:border-primary/40 group-hover:text-primary">
            Ctrl + K
          </kbd>
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buscar"
          className="rounded-lg p-2 text-muted transition-all duration-200 hover:bg-foreground/5 hover:text-primary active:scale-90 sm:hidden"
        >
          <Search className="size-[18px]" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
