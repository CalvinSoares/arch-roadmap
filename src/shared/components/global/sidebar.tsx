"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutGrid, Map, BookOpen, Search, X, Blocks } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useSidebar } from "@/shared/context/sidebar-context";
import { useSearchPalette } from "@/shared/context/search-context";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Compass;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "Início", icon: Compass, exact: true },
  { href: "/roadmaps", label: "Roadmaps", icon: Map },
  { href: "/conceitos", label: "Conceitos", icon: LayoutGrid },
  { href: "/construtor", label: "Construtor", icon: Blocks },
];

function Conteudo({ colapsada }: { colapsada: boolean }) {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const { setOpen } = useSearchPalette();

  return (
    <div className="flex h-full flex-col p-3">
      <div className={cn("mb-4 flex items-center px-1", colapsada && "justify-center")}>
        <Link
          href="/"
          aria-label="DevAtlas — início"
          className="flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <BookOpen className="size-5 shrink-0 text-primary" />
          {!colapsada && (
            <span className="text-lg font-semibold tracking-tight">DevAtlas</span>
          )}
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "mb-3 flex items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-muted transition-colors hover:border-primary/50",
          colapsada && "justify-center px-0"
        )}
        aria-label="Buscar"
        title={colapsada ? "Buscar" : undefined}
      >
        <Search className="size-4 shrink-0" />
        {!colapsada && (
          <>
            <span className="flex-1 text-left">Buscar…</span>
            <kbd className="rounded border border-card-border px-1.5 py-0.5 text-[10px]">
              ⌘K
            </kbd>
          </>
        )}
      </button>

      <nav aria-label="Menu principal" className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              title={colapsada ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                colapsada && "justify-center px-0",
                active
                  ? "bg-primary/12 text-primary"
                  : "text-muted hover:bg-muted/10 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!colapsada && label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop */}
      <aside
        aria-label="Navegação principal"
        className={cn(
          "hidden shrink-0 overflow-hidden border-r border-card-border transition-[width] duration-200 lg:block",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="sticky top-0 h-dvh">
          <Conteudo colapsada={collapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            aria-label="Menu"
            className="absolute left-0 top-0 h-full w-64 border-r border-card-border bg-background"
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-2 top-3 z-10 rounded-md p-1 text-muted hover:bg-muted/10"
            >
              <X className="size-4" />
            </button>
            <Conteudo colapsada={false} />
          </aside>
        </div>
      )}
    </>
  );
}
