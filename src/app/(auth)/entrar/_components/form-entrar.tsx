"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail } from "lucide-react";

const campo =
  "w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

/** Mark do GitHub inline — o lucide desta versão não traz o ícone de marca. */
function IconeGithub({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.42.36.8 1.08.8 2.18v3.23c0 .31.21.67.8.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.74 18.27.5 12 .5Z" />
    </svg>
  );
}

/**
 * Corpo do login — feito para viver dentro do cartão da página `/entrar` (sem
 * cartão próprio). Email/senha (Credentials); GitHub e magic link só aparecem
 * quando provisionados, pra não haver botão que quebra.
 */
export function FormEntrar({
  callbackUrl,
  githubAtivo,
  magicLinkAtivo,
  jaRegistrado,
}: {
  callbackUrl: string;
  githubAtivo: boolean;
  magicLinkAtivo: boolean;
  jaRegistrado: boolean;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [magicEnviado, setMagicEnviado] = useState(false);
  const [pendente, iniciar] = useTransition();

  const entrarCredenciais = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    iniciar(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setErro("E-mail ou senha inválidos.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    });
  };

  const entrarMagicLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    if (!email) return;
    iniciar(async () => {
      await signIn("resend", { email, redirect: false, callbackUrl });
      setMagicEnviado(true);
    });
  };

  return (
    <div className="space-y-4">
      {jaRegistrado && (
        <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-center text-[13px] text-foreground">
          Conta criada! Agora é só entrar.
        </p>
      )}

      {githubAtivo && (
        <>
          <button
            type="button"
            disabled={pendente}
            onClick={() => signIn("github", { callbackUrl })}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-60"
          >
            <IconeGithub className="size-4" />
            Continuar com GitHub
          </button>
          <div className="flex items-center gap-3 text-[12px] text-muted">
            <span className="h-px flex-1 bg-card-border" />
            ou com e-mail
            <span className="h-px flex-1 bg-card-border" />
          </div>
        </>
      )}

      <form onSubmit={entrarCredenciais} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-muted">
            E-mail
          </span>
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
          <span className="mb-1 block text-[13px] font-medium text-muted">
            Senha
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="sua senha"
            className={campo}
          />
        </label>

        {erro && (
          <p role="alert" className="text-[13px] font-medium text-cat-principio">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={pendente}
          className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-sm)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pendente ? "Entrando…" : "Entrar"}
        </button>
      </form>

      {magicLinkAtivo && (
        <form
          onSubmit={entrarMagicLink}
          className="rounded-lg border border-dashed border-card-border p-3"
        >
          {magicEnviado ? (
            <p className="text-center text-[13px] text-muted">
              Link enviado! Confira seu e-mail.
            </p>
          ) : (
            <>
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-muted">
                <Mail className="size-4" /> Ou receba um link mágico
              </p>
              <div className="flex gap-2">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="voce@exemplo.com"
                  className={campo}
                />
                <button
                  type="submit"
                  disabled={pendente}
                  className="shrink-0 rounded-lg border border-card-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-60"
                >
                  Enviar
                </button>
              </div>
            </>
          )}
        </form>
      )}

      <p className="pt-1 text-center text-[13px] text-muted">
        Ainda não tem conta?{" "}
        <Link href="/registrar" className="font-medium text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
