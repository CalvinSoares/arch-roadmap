"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { resolverDenuncia } from "@/server/admin/acoes";

/** Resolve ou descarta uma denúncia da fila de moderação. */
export function AcoesDenuncia({ id }: { id: string }) {
  const [pendente, iniciar] = useTransition();

  const rodar = (status: "resolvida" | "descartada", ok: string) =>
    iniciar(async () => {
      const r = await resolverDenuncia(id, status);
      if (r.ok) toast.success(ok);
      else toast.error(r.erro ?? "Falhou.");
    });

  return (
    <div className="flex shrink-0 gap-1.5">
      <button
        type="button"
        disabled={pendente}
        onClick={() => rodar("resolvida", "Marcada como resolvida.")}
        className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1 text-[13px] font-medium text-primary transition-colors hover:bg-primary/25 disabled:opacity-60"
      >
        <Check className="size-3.5" />
        Resolver
      </button>
      <button
        type="button"
        disabled={pendente}
        onClick={() => rodar("descartada", "Descartada.")}
        className="inline-flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1 text-[13px] font-medium text-muted transition-colors hover:bg-foreground/5 disabled:opacity-60"
      >
        <X className="size-3.5" />
        Descartar
      </button>
    </div>
  );
}
