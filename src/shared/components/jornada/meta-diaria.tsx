"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Zap, Check } from "lucide-react";
import { metaDoDia, type MetaDoDia } from "@/server/gamificacao/status";

const R = 20;
const CIRC = 2 * Math.PI * R;

/**
 * Anel de meta diária de XP — a alavanca de retorno, "com respeito": um objetivo
 * modesto (50 XP/dia), sem punição por não bater. Só aparece logado; lê o XP de
 * hoje do ledger. Fica invisível deslogado (vazio na chegada).
 */
export function MetaDiaria() {
  const { status } = useSession();
  const [dados, setDados] = useState<MetaDoDia | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let vivo = true;
    metaDoDia()
      .then((d) => {
        if (vivo) setDados(d);
      })
      .catch(() => {
        /* offline/erro — o anel só não aparece */
      });
    return () => {
      vivo = false;
    };
  }, [status]);

  if (status !== "authenticated" || !dados) return null;

  const pct = dados.meta > 0 ? Math.min(1, dados.xpHoje / dados.meta) : 0;

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-card-border bg-card p-4">
      <div className="relative size-14 shrink-0">
        <svg viewBox="0 0 48 48" className="size-14 -rotate-90">
          <circle
            cx="24"
            cy="24"
            r={R}
            fill="none"
            stroke="var(--foreground)"
            strokeOpacity="0.1"
            strokeWidth="5"
          />
          <circle
            cx="24"
            cy="24"
            r={R}
            fill="none"
            stroke="var(--glow-c)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct)}
            style={{ transition: "stroke-dashoffset .6s ease" }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[var(--glow-c)]">
          {dados.atingiu ? <Check className="size-5" /> : <Zap className="size-5" />}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Meta diária</p>
        <p className="text-[13px] text-muted">
          {dados.atingiu
            ? "Concluída hoje! 🎉"
            : `${dados.xpHoje}/${dados.meta} XP hoje`}
        </p>
      </div>
    </div>
  );
}
