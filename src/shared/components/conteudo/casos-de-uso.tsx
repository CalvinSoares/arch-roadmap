import { Scale, TriangleAlert } from "lucide-react";
import type { CasoDeUso } from "@/shared/types/bloco";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </p>
  );
}

/**
 * Casos de uso reais. Cada card segue a mesma estrutura (cenário → como o
 * padrão entra → o que se paga por isso), pro leitor comparar casos sem
 * reler a estrutura toda vez.
 */
export function CasosDeUso({ casos }: { casos: CasoDeUso[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {casos.map((c, i) => (
        <article
          key={c.titulo}
          className="flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
        >
          <header className="flex items-start gap-3 border-b border-card-border px-5 py-4">
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--acento)_14%,transparent)] font-mono text-[11px] font-bold text-[var(--acento)]"
            >
              {i + 1}
            </span>
            <h3 className="font-semibold leading-snug tracking-tight">{c.titulo}</h3>
          </header>

          <div className="flex flex-1 flex-col gap-4 px-5 py-4">
            <div>
              <Rotulo>Cenário</Rotulo>
              <p className="mt-1 text-sm leading-relaxed text-muted"><TextoRico>{c.cenario}</TextoRico></p>
            </div>
            <div className="flex-1">
              <Rotulo>Como o padrão entra</Rotulo>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                <TextoRico>{c.aplicacao}</TextoRico>
              </p>
            </div>
          </div>

          <p className="mt-auto flex gap-2.5 border-t border-card-border bg-[color-mix(in_srgb,var(--alerta)_7%,transparent)] px-5 py-3.5 text-[13px] leading-relaxed text-muted">
            <Scale className="mt-0.5 size-3.5 shrink-0 text-[var(--alerta)]" />
            <span>
              <b className="font-semibold text-foreground">Trade-off:</b>{" "}
              <TextoRico>{c.tradeoff}</TextoRico>
            </span>
          </p>
        </article>
      ))}
    </div>
  );
}

/** Erros comuns, numerados para virar checklist de revisão de código. */
export function Armadilhas({ itens }: { itens: { titulo: string; texto: string }[] }) {
  return (
    <ol className="overflow-hidden rounded-2xl border border-card-border bg-card">
      {itens.map((a) => (
        <li
          key={a.titulo}
          className="flex gap-4 border-b border-card-border p-5 last:border-b-0 transition-colors hover:bg-[color-mix(in_srgb,var(--perigo)_5%,transparent)]"
        >
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--perigo)_12%,transparent)] text-[var(--perigo)]"
          >
            <TriangleAlert className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold leading-snug text-[var(--perigo)]">
              {a.titulo}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">
              <TextoRico>{a.texto}</TextoRico>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
