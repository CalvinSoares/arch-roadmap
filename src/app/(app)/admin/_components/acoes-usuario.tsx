"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  definirPapel,
  definirBanido,
  definirShadowBan,
  type Papel,
} from "@/server/admin/acoes";
import type { UsuarioAdmin } from "@/server/admin/consultas";

/**
 * Controles por usuário na tabela do admin: papel (RBAC), ban e shadow-ban.
 * As ações revalidam `/admin/usuarios` no servidor; aqui é só disparar + toast.
 */
export function AcoesUsuario({ usuario }: { usuario: UsuarioAdmin }) {
  const [pendente, iniciar] = useTransition();

  const rodar = (fn: () => Promise<{ ok: boolean; erro?: string }>, ok: string) =>
    iniciar(async () => {
      const r = await fn();
      if (r.ok) toast.success(ok);
      else toast.error(r.erro ?? "Falhou.");
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        defaultValue={usuario.role}
        disabled={pendente}
        onChange={(e) =>
          rodar(
            () => definirPapel(usuario.id, e.target.value as Papel),
            "Papel atualizado."
          )
        }
        aria-label="Papel"
        className="rounded-lg border border-card-border bg-background px-2 py-1 text-[13px] outline-none focus:border-primary/60"
      >
        <option value="user">user</option>
        <option value="moderator">moderator</option>
        <option value="admin">admin</option>
      </select>

      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          rodar(
            () => definirBanido(usuario.id, !usuario.banido),
            usuario.banido ? "Desbanido." : "Banido."
          )
        }
        className={`rounded-lg px-2.5 py-1 text-[13px] font-medium transition-colors disabled:opacity-60 ${
          usuario.banido
            ? "bg-cat-principio/15 text-cat-principio hover:bg-cat-principio/25"
            : "border border-card-border text-muted hover:bg-foreground/5"
        }`}
      >
        {usuario.banido ? "Banido" : "Banir"}
      </button>

      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          rodar(
            () => definirShadowBan(usuario.id, !usuario.shadowBan),
            usuario.shadowBan ? "Shadow-ban removido." : "Shadow-ban aplicado."
          )
        }
        className={`rounded-lg px-2.5 py-1 text-[13px] font-medium transition-colors disabled:opacity-60 ${
          usuario.shadowBan
            ? "bg-accent/15 text-accent hover:bg-accent/25"
            : "border border-card-border text-muted hover:bg-foreground/5"
        }`}
      >
        {usuario.shadowBan ? "Shadow" : "Shadow-ban"}
      </button>
    </div>
  );
}
