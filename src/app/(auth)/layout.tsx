import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Shell das telas de conta (entrar/registrar) — **fora** do chrome do app: sem
 * sidebar, sem header. Só o essencial: um botão "Voltar", a marca, e o cartão
 * centrado sobre um fundo com brilho suave. Continua dentro do `<Providers>` da
 * raiz, então tema e sessão funcionam normalmente.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="textura-grao relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-12">
      {/* brilhos de fundo — dão vida sem competir com o formulário */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-0 size-[28rem] rounded-full bg-accent/15 blur-[120px]"
      />

      {/* voltar ao site */}
      <Link
        href="/"
        className="absolute left-4 top-4 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground sm:left-6 sm:top-6"
      >
        <ArrowLeft className="size-4" />
        Voltar ao site
      </Link>

      <main className="relative z-10 w-full max-w-md">
        {/* marca */}
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-[var(--glow-c)] shadow-[var(--shadow-md)]">
            <span className="absolute size-5 rounded-full border-[1.5px] border-primary-foreground/70" />
            <span className="absolute h-5 w-2.5 rounded-full border-[1.5px] border-primary-foreground/70" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            DevMappa
          </span>
        </Link>

        {children}
      </main>
    </div>
  );
}
