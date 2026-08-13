"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Flame } from "lucide-react";
import { meuStatus, type StatusResumido } from "@/server/gamificacao/status";

/**
 * Indicador persistente de progresso no header: nível (com anel de XP) + streak.
 * Só aparece logado. Rebusca ao autenticar e a cada troca de rota — assim, depois
 * de ganhar XP num quiz/nó, o badge já reflete na navegação seguinte.
 *
 * É leve: uma leitura da projeção (`meuStatus`). Fica invisível deslogado, fiel à
 * filosofia "vazio na chegada".
 */
export function StatusGamificacao() {
  const { status } = useSession();
  const pathname = usePathname();
  const [dados, setDados] = useState<StatusResumido | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let vivo = true;
    meuStatus()
      .then((d) => {
        if (vivo) setDados(d);
      })
      .catch(() => {
        /* offline/erro — o indicador só não atualiza */
      });
    return () => {
      vivo = false;
    };
  }, [status, pathname]);

  // Deslogado, o guard esconde o indicador mesmo que `dados` tenha ficado de uma
  // sessão anterior — sem precisar de setState síncrono no efeito.
  if (status !== "authenticated" || !dados) return null;

  const pctLargura = `${Math.round(dados.pct * 100)}%`;

  return (
    <Link
      href="/perfil"
      title={`Nível ${dados.nivel} · ${dados.xpTotal} XP`}
      aria-label={`Nível ${dados.nivel}, streak de ${dados.streakDias} dias`}
      className="relative flex items-center gap-2 overflow-hidden rounded-full border border-card-border bg-card/60 px-3 py-1.5 text-sm transition-all duration-200 hover:border-primary/45 hover:bg-card active:scale-95"
    >
      {dados.streakDias > 0 && (
        <>
          <span className="flex items-center gap-1 font-semibold text-cat-principio">
            <Flame className="size-4" />
            {dados.streakDias}
          </span>
          <span aria-hidden className="h-3.5 w-px bg-card-border" />
        </>
      )}

      <span className="flex items-baseline gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          Nv
        </span>
        <span className="font-bold text-foreground">{dados.nivel}</span>
      </span>

      {/* Progresso do nível como um filete ao pé da pílula — sem círculos aninhados */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground/10"
      >
        <span
          className="block h-full bg-gradient-to-r from-primary to-[var(--glow-c)] transition-[width] duration-500"
          style={{ width: pctLargura }}
        />
      </span>
    </Link>
  );
}
