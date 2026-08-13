"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrar, type EstadoRegistro } from "@/server/auth/registrar";

const campo =
  "w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

/**
 * Corpo do cadastro — feito para viver dentro do cartão da página `/registrar`.
 * Cria a conta por email/senha (server action `registrar`, hash argon2id).
 */
export function FormRegistro() {
  const [estado, action, pending] = useActionState<EstadoRegistro, FormData>(
    registrar,
    {}
  );

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-muted">Nome</span>
          <input
            name="name"
            autoComplete="name"
            placeholder="Como te chamar"
            className={campo}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-muted">E-mail</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="voce@exemplo.com"
            className={campo}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-muted">Senha</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="ao menos 8 caracteres"
            className={campo}
          />
        </label>

        {estado.erro && (
          <p role="alert" className="text-[13px] font-medium text-cat-principio">
            {estado.erro}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-sm)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Criando…" : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-[13px] text-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
