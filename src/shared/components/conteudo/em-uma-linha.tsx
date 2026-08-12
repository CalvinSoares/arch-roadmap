import { Minimize2, Coins } from "lucide-react";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { highlightCode } from "@/shared/lib/highlight";
import type { Conceito } from "@/shared/types/conceito";

interface Props {
  emUmaLinha?: Conceito["emUmaLinha"];
  custo?: NonNullable<Conceito["custo"]>;
}

/**
 * O essencial e o preço, lado a lado.
 *
 * Os dois moram no mesmo bloco de propósito: o snippet mínimo mostra como o
 * padrão é barato de escrever, e o custo mostra o que ele cobra depois. Vistos
 * juntos, evitam a leitura ingênua de que "é só isso, então uso sempre".
 */
export async function EmUmaLinha({ emUmaLinha, custo }: Props) {
  if (!emUmaLinha && !custo) return null;

  // o highlight roda no servidor, como em todo o resto do conteúdo
  const html = emUmaLinha
    ? await highlightCode(emUmaLinha.code, emUmaLinha.lang)
    : null;

  return (
    <section
      aria-labelledby="essencial"
      className="grid min-w-0 gap-4 lg:grid-cols-2"
    >
      {emUmaLinha && (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-card-border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Minimize2 aria-hidden className="size-4 shrink-0 text-[var(--acento)]" />
            <h2 id="essencial" className="text-sm font-semibold tracking-tight">
              O padrão em uma linha
            </h2>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Sem nome de domínio, sem cerimônia — só a ideia.
          </p>
          <div
            className="mt-3 max-w-full overflow-x-auto overscroll-x-contain rounded-xl [-webkit-overflow-scrolling:touch] [&_.shiki]:max-w-none [&_.shiki]:text-[12px] sm:[&_.shiki]:text-[13px]"
            dangerouslySetInnerHTML={{ __html: html! }}
          />
        </div>
      )}

      {custo && (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-card-border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Coins
              aria-hidden
              className="size-4 shrink-0"
              style={{ color: "var(--alerta)" }}
            />
            <h2 className="text-sm font-semibold tracking-tight">
              O que ele cobra
            </h2>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            {custo.indirecoes === 0
              ? "Nenhum salto a mais entre a chamada e o efeito."
              : `${custo.indirecoes} salto${custo.indirecoes > 1 ? "s" : ""} a mais entre a chamada e o efeito.`}
          </p>

          <ul className="mt-3 space-y-1.5">
            {custo.cobra.map((c) => (
              <li
                key={c}
                className="flex gap-2 text-[14px] leading-relaxed [overflow-wrap:anywhere]"
              >
                <span aria-hidden className="shrink-0" style={{ color: "var(--alerta)" }}>
                  −
                </span>
                <span className="min-w-0">
                  <TextoRico>{c}</TextoRico>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 border-t border-card-border pt-3 text-[13px] leading-relaxed text-muted [overflow-wrap:anywhere]">
            <span className="font-semibold text-foreground">Não vale se: </span>
            <TextoRico>{custo.naoValeSe}</TextoRico>
          </p>
        </div>
      )}
    </section>
  );
}
