"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Target,
  Check,
  Swords,
  Users,
  Trophy,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { missoesDeHoje, type MissaoHoje } from "@/server/gamificacao/status";
import { MetaDiaria } from "@/shared/components/jornada/meta-diaria";
import { cn } from "@/shared/utils/cn";

/**
 * Rail lateral da jornada (desktop): o contexto de jogo ao lado do path, como
 * no Duolingo. Meta diária, missões do dia e atalhos de competição. Anônimo vê
 * o convite de conta no lugar das missões ("login é acréscimo, não portão").
 */
export function RailJornada() {
  const { status } = useSession();

  return (
    <div className="space-y-4">
      <MetaDiaria />
      {status === "authenticated" ? <MissoesDoDia /> : <ConviteConta />}
      <Atalhos logado={status === "authenticated"} />
    </div>
  );
}

function MissoesDoDia() {
  const [missoes, setMissoes] = useState<MissaoHoje[] | null>(null);

  useEffect(() => {
    let vivo = true;
    missoesDeHoje()
      .then((m) => {
        if (vivo) setMissoes(m);
      })
      .catch(() => {
        /* offline/erro; o card só não aparece */
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (!missoes || missoes.length === 0) return null;

  return (
    <section className="rounded-2xl border border-card-border bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Target className="size-4 text-primary" />
        Missões de hoje
      </h2>
      <ul className="mt-3 space-y-3">
        {missoes.map((m) => {
          const pct = Math.min(100, Math.round((m.progresso / m.meta) * 100));
          return (
            <li key={m.id}>
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "truncate text-[13px] font-medium",
                    m.concluida ? "text-muted line-through" : "text-foreground"
                  )}
                >
                  {m.descricao}
                </p>
                {m.concluida ? (
                  <Check className="size-4 shrink-0 text-cat-criacional" />
                ) : (
                  <span className="shrink-0 text-[11px] font-bold text-[var(--glow-c)]">
                    +{m.xpRecompensa}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-500",
                      m.concluida ? "bg-cat-criacional" : "bg-primary"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
                  {Math.min(m.progresso, m.meta)}/{m.meta}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ConviteConta() {
  return (
    <section className="rounded-2xl border border-card-border bg-gradient-to-br from-card to-primary/5 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Sparkles className="size-4 text-[var(--glow-c)]" />
        Jogue com uma conta
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        XP, streak, missões diárias e liga semanal. Seu progresso te segue em
        qualquer dispositivo.
      </p>
      <Link
        href="/entrar"
        className="mt-3 block w-full rounded-xl bg-primary px-3 py-2.5 text-center text-sm font-bold text-primary-foreground shadow-[0_3px_0_color-mix(in_srgb,var(--primary)_55%,#000)] transition-transform active:translate-y-0.5"
      >
        Entrar
      </Link>
      <p className="mt-2 text-center text-[12px] text-muted">
        Novo aqui?{" "}
        <Link href="/registrar" className="font-medium text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </section>
  );
}

function Atalhos({ logado }: { logado: boolean }) {
  if (!logado) return null;
  const item =
    "flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5";
  return (
    <section className="rounded-2xl border border-card-border bg-card p-2">
      <Link href="/liga" className={item}>
        <span className="flex items-center gap-2">
          <Swords className="size-4 text-cat-resiliencia" />
          Liga da semana
        </span>
        <ChevronRight className="size-4 text-muted" />
      </Link>
      <Link href="/amigos" className={item}>
        <span className="flex items-center gap-2">
          <Users className="size-4 text-cat-estrutural" />
          Amigos
        </span>
        <ChevronRight className="size-4 text-muted" />
      </Link>
      <Link href="/perfil" className={item}>
        <span className="flex items-center gap-2">
          <Trophy className="size-4 text-[var(--glow-c)]" />
          Seu perfil
        </span>
        <ChevronRight className="size-4 text-muted" />
      </Link>
    </section>
  );
}
