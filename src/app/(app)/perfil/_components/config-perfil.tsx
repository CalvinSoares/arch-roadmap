"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Globe, Lock, Bell, BellOff } from "lucide-react";
import {
  definirHandle,
  alternarPerfilPublico,
  alternarLembretes,
} from "@/server/perfil/acoes";
import { erroHandle } from "@/shared/lib/handle";

const campo =
  "w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60";

/**
 * Configurações de perfil público (opt-in, LGPD). Handle + interruptor de
 * visibilidade. O handle vira o endereço `/u/<handle>`; sem ele, não dá pra
 * ficar público.
 */
export function ConfigPerfil({
  handleInicial,
  publicoInicial,
  lembretesInicial,
}: {
  handleInicial: string | null;
  publicoInicial: boolean;
  lembretesInicial: boolean;
}) {
  const [handle, setHandle] = useState(handleInicial ?? "");
  const [publico, setPublico] = useState(publicoInicial);
  const [lembretes, setLembretes] = useState(lembretesInicial);
  const [pendente, iniciar] = useTransition();

  const salvarHandle = () => {
    const problema = erroHandle(handle);
    if (problema) {
      toast.error(problema);
      return;
    }
    iniciar(async () => {
      const r = await definirHandle(handle);
      if (r.ok) toast.success("Handle salvo.");
      else toast.error(r.erro ?? "Não deu pra salvar.");
    });
  };

  const alternar = () => {
    const alvo = !publico;
    iniciar(async () => {
      const r = await alternarPerfilPublico(alvo);
      if (r.ok) {
        setPublico(alvo);
        toast.success(alvo ? "Perfil público." : "Perfil privado.");
      } else {
        toast.error(r.erro ?? "Não deu pra alterar.");
      }
    });
  };

  const alternarLembrete = () => {
    const alvo = !lembretes;
    iniciar(async () => {
      const r = await alternarLembretes(alvo);
      if (r.ok) {
        setLembretes(alvo);
        toast.success(alvo ? "Lembretes ligados." : "Lembretes desligados.");
      } else {
        toast.error(r.erro ?? "Não deu pra alterar.");
      }
    });
  };

  return (
    <section className="rounded-2xl border border-card-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Perfil público</h2>
      <p className="mt-1 text-[13px] text-muted">
        Opcional. Ligado, seu perfil fica visível em{" "}
        <code className="rounded bg-foreground/5 px-1">/u/{handle || "seu-handle"}</code>.
      </p>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-muted">
            Seu @handle
          </span>
          <div className="flex gap-2">
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="calvin"
              autoCapitalize="none"
              spellCheck={false}
              className={campo}
            />
            <button
              type="button"
              onClick={salvarHandle}
              disabled={pendente}
              className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
        </label>

        <button
          type="button"
          onClick={alternar}
          disabled={pendente}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-card-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-foreground/5 disabled:opacity-60"
        >
          <span className="flex items-center gap-2 text-foreground">
            {publico ? (
              <Globe className="size-4 text-primary" />
            ) : (
              <Lock className="size-4 text-muted" />
            )}
            {publico ? "Perfil público" : "Perfil privado"}
          </span>
          <span
            aria-hidden
            className={`relative h-5 w-9 rounded-full transition-colors ${
              publico ? "bg-primary" : "bg-foreground/20"
            }`}
          >
            <span
              className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                publico ? "left-4" : "left-0.5"
              }`}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={alternarLembrete}
          disabled={pendente}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-card-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-foreground/5 disabled:opacity-60"
        >
          <span className="flex items-center gap-2 text-foreground">
            {lembretes ? (
              <Bell className="size-4 text-primary" />
            ) : (
              <BellOff className="size-4 text-muted" />
            )}
            E-mails de lembrete de streak
          </span>
          <span
            aria-hidden
            className={`relative h-5 w-9 rounded-full transition-colors ${
              lembretes ? "bg-primary" : "bg-foreground/20"
            }`}
          >
            <span
              className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                lembretes ? "left-4" : "left-0.5"
              }`}
            />
          </span>
        </button>
      </div>
    </section>
  );
}
