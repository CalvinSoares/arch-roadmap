"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Compass,
  LayoutGrid,
  Map,
  Search,
  X,
  Blocks,
  Sparkles,
  GraduationCap,
  GitCompareArrows,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useSidebar } from "@/shared/context/sidebar-context";
import { useSearchPalette } from "@/shared/context/search-context";
import { temNovidadeRecente } from "@/shared/lib/novidades";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Cor de acento do item (token CSS) — pinta ícone e realce ativos. */
  cor: string;
  /** Mostra um ponto de aviso quando há entrega recente. */
  avisoNovidade?: boolean;
}

interface Grupo {
  titulo: string;
  itens: NavItem[];
}

const GRUPOS: Grupo[] = [
  {
    titulo: "Explorar",
    itens: [
      { href: "/", label: "Início", icon: Compass, exact: true, cor: "var(--primary)" },
      { href: "/roadmaps", label: "Roadmaps", icon: Map, cor: "var(--cat-estrutural)" },
      { href: "/conceitos", label: "Conceitos", icon: LayoutGrid, cor: "var(--cat-criacional)" },
    ],
  },
  {
    titulo: "Ferramentas",
    itens: [
      { href: "/construtor", label: "Construtor", icon: Blocks, cor: "var(--cat-comportamental)" },
      { href: "/estudar", label: "Estudar", icon: GraduationCap, cor: "var(--cat-arquitetura)" },
      { href: "/comparar", label: "Comparar", icon: GitCompareArrows, cor: "var(--cat-estrutural)" },
      { href: "/quiz", label: "Quiz", icon: CircleHelp, cor: "var(--cat-principio)" },
    ],
  },
  {
    titulo: "Projeto",
    itens: [
      {
        href: "/novidades",
        label: "Novidades",
        icon: Sparkles,
        cor: "var(--cat-principio)",
        avisoNovidade: true,
      },
    ],
  },
];

const MOLA = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

/**
 * `false` no servidor, valor real no cliente. O HTML é gerado no build e o
 * "recente" depende do relógio de quem visita — resolver só no cliente evita
 * divergência de hidratação.
 */
const semInscricao = () => () => {};
function useNovidadeRecente() {
  return useSyncExternalStore(
    semInscricao,
    () => temNovidadeRecente(),
    () => false
  );
}

/* ------------------------------------------------------------------ */

function Marca({ colapsada, onNavigate }: { colapsada: boolean; onNavigate: () => void }) {
  return (
    <Link
      href="/"
      aria-label="DevAtlas — início"
      onClick={onNavigate}
      className={cn(
        "group/marca flex items-center gap-2.5 rounded-xl px-1 py-1",
        colapsada && "justify-center px-0"
      )}
    >
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[0.7rem] bg-gradient-to-br from-primary to-[var(--glow-c)] shadow-[var(--shadow-md)] transition-transform duration-500 group-hover/marca:rotate-[8deg] group-hover/marca:scale-105">
        {/* anéis concêntricos — "atlas" desenhado, sem depender de ícone */}
        <span className="absolute size-6 rounded-full border-[1.5px] border-primary-foreground/70" />
        <span className="absolute h-6 w-3 rounded-full border-[1.5px] border-primary-foreground/70" />
        <span className="absolute h-[1.5px] w-6 bg-primary-foreground/70" />
      </span>
      {!colapsada && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight">DevAtlas</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">
            padrões &amp; arquitetura
          </span>
        </span>
      )}
    </Link>
  );
}

function BotaoBusca({ colapsada }: { colapsada: boolean }) {
  const { setOpen } = useSearchPalette();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Buscar"
      title={colapsada ? "Buscar" : undefined}
      className={cn(
        "group/busca relative flex items-center gap-2.5 rounded-xl border border-card-border bg-card/70 px-3.5 py-2.5 text-sm text-muted",
        "transition-all duration-300 hover:border-primary/45 hover:bg-card hover:text-foreground hover:shadow-[var(--shadow-md)]",
        colapsada && "justify-center px-0"
      )}
    >
      <Search className="size-4 shrink-0 transition-transform duration-300 group-hover/busca:scale-110 group-hover/busca:text-primary" />
      {!colapsada && (
        <>
          <span className="flex-1 text-left">Buscar…</span>
          <kbd className="rounded-md border border-card-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted transition-colors group-hover/busca:border-primary/40 group-hover/busca:text-primary">
            Ctrl + K
          </kbd>
        </>
      )}
    </button>
  );
}

function ItemNav({
  item,
  ativo,
  colapsada,
  onNavigate,
}: {
  item: NavItem;
  ativo: boolean;
  colapsada: boolean;
  onNavigate: () => void;
}) {
  const { icon: Icon, href, label, cor } = item;
  const recente = useNovidadeRecente();
  // já estando na página, o aviso perdeu a função
  const avisar = Boolean(item.avisoNovidade) && recente && !ativo;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={ativo ? "page" : undefined}
      style={{ ["--acento" as string]: cor }}
      className={cn(
        "group/item relative flex items-center gap-2.5 rounded-xl p-1.5 text-sm font-medium outline-none",
        "transition-transform duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring",
        colapsada && "justify-center",
        ativo ? "text-foreground" : "text-muted hover:translate-x-0.5 hover:text-foreground"
      )}
    >
      {/* superfície levantada do item ativo — desliza entre os itens */}
      {ativo && (
        <motion.span
          layoutId="nav-superficie"
          transition={MOLA}
          aria-hidden
          className="absolute inset-0 rounded-xl bg-card"
          style={{ boxShadow: "inset 0 0 0 1px var(--card-border), var(--shadow-sm)" }}
        />
      )}
      {/* hover fantasma (só quando não está ativo) */}
      {!ativo && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl bg-foreground/[0.045] opacity-0 transition-opacity duration-200 group-hover/item:opacity-100"
        />
      )}

      {/* ladrilho do ícone — "acende" na cor do item quando ativo */}
      <span
        aria-hidden
        className={cn(
          "relative z-10 grid size-8 shrink-0 place-items-center rounded-[0.6rem]",
          "transition-all duration-300 ease-out",
          !ativo &&
            "bg-foreground/[0.06] group-hover/item:scale-105 group-hover/item:bg-[color-mix(in_srgb,var(--acento)_16%,transparent)] group-hover/item:text-[var(--acento)]"
        )}
        style={
          ativo
            ? {
                background: cor,
                color: "var(--background)",
                boxShadow:
                  "0 5px 16px -5px color-mix(in srgb, var(--acento) 75%, transparent)",
              }
            : undefined
        }
      >
        <Icon className="size-[17px]" />
        {/* colapsada: o aviso mora no canto do ladrilho */}
        {colapsada && avisar && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-primary" />
        )}
      </span>

      {!colapsada && (
        <span className="relative z-10 truncate">
          {label}
          <span className="sr-only">{avisar ? " — há novidades" : ""}</span>
        </span>
      )}

      {/* aviso de entrega recente */}
      {!colapsada && avisar && (
        <span
          aria-hidden
          className="relative z-10 ml-auto mr-1 rounded-full bg-primary/14 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-primary"
        >
          Novo
        </span>
      )}

      {/* ponto de status no fim da linha */}
      {!colapsada && ativo && (
        <motion.span
          layoutId="nav-ponto"
          transition={MOLA}
          aria-hidden
          className="relative z-10 ml-auto mr-1.5 size-1.5 shrink-0 rounded-full"
          style={{ background: cor }}
        />
      )}

      {/* tooltip quando colapsada */}
      {colapsada && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full z-50 ml-3 origin-left scale-90 whitespace-nowrap rounded-lg border border-card-border bg-elevated px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-[var(--shadow-lg)] transition-all duration-200 group-hover/item:scale-100 group-hover/item:opacity-100"
        >
          {label}
        </span>
      )}
    </Link>
  );
}

function Conteudo({ colapsada }: { colapsada: boolean }) {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const fechar = () => setMobileOpen(false);

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <Marca colapsada={colapsada} onNavigate={fechar} />
      <BotaoBusca colapsada={colapsada} />

      <LayoutGroup id="sidebar-nav">
        <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-5">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo} className="flex flex-col gap-1">
              {colapsada ? (
                <span aria-hidden className="mx-auto mb-1 h-px w-6 bg-card-border" />
              ) : (
                <span className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80">
                  {grupo.titulo}
                </span>
              )}
              {grupo.itens.map((item) => (
                <ItemNav
                  key={item.href}
                  item={item}
                  colapsada={colapsada}
                  onNavigate={fechar}
                  ativo={
                    item.exact ? pathname === item.href : pathname.startsWith(item.href)
                  }
                />
              ))}
            </div>
          ))}
        </nav>
      </LayoutGroup>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop */}
      <aside
        aria-label="Navegação principal"
        className={cn(
          "relative hidden shrink-0 overflow-hidden bg-background transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
          collapsed ? "w-[4.5rem]" : "w-64"
        )}
      >
        {/* borda direita em degradê, em vez de linha chapada */}
        <span
          aria-hidden
          className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-card-border to-transparent"
        />
        <div className="sticky top-0 h-dvh">
          <Conteudo colapsada={collapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-[#1a0f09]/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              aria-label="Menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute left-0 top-0 h-full w-72 border-r border-card-border bg-background shadow-[var(--shadow-lg)]"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="absolute right-2 top-3 z-10 rounded-lg p-1.5 text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
              <Conteudo colapsada={false} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
