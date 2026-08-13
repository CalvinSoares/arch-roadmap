"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  LogIn,
  LogOut,
  User as UserIcon,
  Trophy,
  Users,
  Swords,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

/**
 * Conta no header. Reflete a sessão real (Auth.js) via `useSession`:
 * - deslogado → botão "Entrar";
 * - logado → avatar (imagem do provedor ou inicial) com menu de "Sair".
 *
 * Fecha ao clicar fora e ao apertar Esc. O login em si vive na tela própria
 * `/entrar`; aqui é só o reflexo visual do estado.
 */
export function UserMenu() {
  const { data, status } = useSession();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const aoClicarFora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  if (status === "loading") {
    return (
      <span
        aria-hidden
        className="size-8 animate-pulse rounded-full bg-foreground/10"
      />
    );
  }

  if (status !== "authenticated") {
    return (
      <Link
        href="/entrar"
        className="flex items-center gap-1.5 rounded-full border border-card-border bg-card/60 py-1.5 pl-2.5 pr-3 text-sm text-muted transition-all duration-200 hover:border-primary/45 hover:bg-card hover:text-foreground active:scale-95"
      >
        <LogIn className="size-4" />
        <span className="hidden sm:inline">Entrar</span>
      </Link>
    );
  }

  const usuario = data.user;
  const nome = usuario?.name || usuario?.email || "Conta";
  const inicial = nome.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label="Menu da conta"
        className={cn(
          "grid size-8 place-items-center overflow-hidden rounded-full border border-card-border bg-card text-sm font-semibold text-foreground transition-all duration-200 hover:border-primary/45 active:scale-90",
          aberto && "border-primary/45 ring-2 ring-primary/20"
        )}
      >
        {usuario?.image ? (
          // Avatar de provedor externo (GitHub); domínio arbitrário, por isso
          // <img> em vez de next/image (evita allowlist em next.config).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={usuario.image} alt="" className="size-full object-cover" />
        ) : (
          inicial
        )}
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl border border-card-border bg-card p-1 shadow-[var(--shadow-md)]"
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <UserIcon className="size-4 shrink-0 text-muted" />
            <span className="truncate text-[13px] text-muted" title={nome}>
              {nome}
            </span>
          </div>
          <span className="mx-2 my-1 block h-px bg-card-border" aria-hidden />
          <Link
            href="/perfil"
            role="menuitem"
            onClick={() => setAberto(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-foreground/5"
          >
            <Trophy className="size-4" />
            Seu perfil
          </Link>
          <Link
            href="/amigos"
            role="menuitem"
            onClick={() => setAberto(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-foreground/5"
          >
            <Users className="size-4" />
            Amigos
          </Link>
          <Link
            href="/liga"
            role="menuitem"
            onClick={() => setAberto(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-foreground/5"
          >
            <Swords className="size-4" />
            Liga
          </Link>
          {usuario?.role === "admin" && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setAberto(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-foreground/5"
            >
              <ShieldCheck className="size-4 text-primary" />
              Admin
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-foreground/5"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
