"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, Check, X } from "lucide-react";
import {
  enviarConvite,
  aceitarConvite,
  removerAmizade,
} from "@/server/social/acoes";
import type { ConvitePendente } from "@/server/social/consultas";

const campo =
  "w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60";

/**
 * Parte interativa da página de amigos: adicionar por @handle e responder aos
 * convites recebidos. O ranking em si é renderizado no servidor (dado só de
 * leitura); aqui ficam as ações. Após cada ação o server revalida `/amigos`.
 */
export function GerenciarAmigos({
  pendentes,
}: {
  pendentes: ConvitePendente[];
}) {
  const [handle, setHandle] = useState("");
  const [pendente, iniciar] = useTransition();

  const adicionar = () => {
    if (!handle.trim()) return;
    iniciar(async () => {
      const r = await enviarConvite(handle);
      if (r.ok) {
        toast.success("Convite enviado.");
        setHandle("");
      } else {
        toast.error(r.erro ?? "Não deu pra enviar.");
      }
    });
  };

  const aceitar = (origemId: string) =>
    iniciar(async () => {
      const r = await aceitarConvite(origemId);
      if (r.ok) toast.success("Amizade aceita.");
      else toast.error(r.erro ?? "Não deu pra aceitar.");
    });

  const recusar = (origemId: string) =>
    iniciar(async () => {
      const r = await removerAmizade(origemId);
      if (r.ok) toast.success("Convite recusado.");
      else toast.error(r.erro ?? "Não deu.");
    });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-card-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserPlus className="size-4 text-primary" />
          Adicionar amigo
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Pelo @handle. A pessoa precisa ter um perfil com handle definido.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@handle"
            autoCapitalize="none"
            spellCheck={false}
            onKeyDown={(e) => e.key === "Enter" && adicionar()}
            className={campo}
          />
          <button
            type="button"
            onClick={adicionar}
            disabled={pendente}
            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Enviar
          </button>
        </div>
      </section>

      {pendentes.length > 0 && (
        <section className="rounded-2xl border border-card-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Convites recebidos
          </h2>
          <ul className="mt-3 space-y-2">
            {pendentes.map((c) => (
              <li
                key={c.origemId}
                className="flex items-center justify-between gap-3 rounded-lg border border-card-border px-3 py-2"
              >
                <span className="truncate text-sm text-foreground">
                  {c.handle ? `@${c.handle}` : c.nome ?? "Alguém"}
                </span>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => aceitar(c.origemId)}
                    disabled={pendente}
                    aria-label="Aceitar"
                    className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary transition-colors hover:bg-primary/25 disabled:opacity-60"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => recusar(c.origemId)}
                    disabled={pendente}
                    aria-label="Recusar"
                    className="grid size-8 place-items-center rounded-lg bg-foreground/5 text-muted transition-colors hover:bg-foreground/10 disabled:opacity-60"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
