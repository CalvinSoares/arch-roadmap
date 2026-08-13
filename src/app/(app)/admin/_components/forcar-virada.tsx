"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { forcarViradaTemporada } from "@/server/admin/acoes";

/** Dispara a virada de temporada manualmente (o cron faz isso semanalmente). */
export function ForcarVirada() {
  const [pendente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pendente}
      onClick={() =>
        iniciar(async () => {
          const r = await forcarViradaTemporada();
          if (r.ok) toast.success("Temporada virada.");
          else toast.error(r.erro ?? "Falhou.");
        })
      }
      className="inline-flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-60"
    >
      <RefreshCw className={`size-4 ${pendente ? "animate-spin" : ""}`} />
      Virar temporada agora
    </button>
  );
}
