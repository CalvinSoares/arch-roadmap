import { ArrowUpRight, Radar } from "lucide-react";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import type { OndeAparece as Item } from "@/shared/types/conceito";

/**
 * "Onde isto aparece de verdade": liga a abstração ao código que a pessoa
 * já usa.
 *
 * Fica depois do conteúdo e antes dos relacionados de propósito: primeiro se
 * aprende o padrão, depois se descobre que já se convivia com ele.
 */
export function OndeAparece({ itens }: { itens: Item[] }) {
  if (itens.length === 0) return null;

  return (
    <section aria-labelledby="onde-aparece">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-lg"
          style={{
            background: "color-mix(in srgb, var(--acento) 14%, transparent)",
            color: "var(--acento)",
          }}
        >
          <Radar className="size-4" />
        </span>
        <div>
          <h2
            id="onde-aparece"
            className="text-lg font-semibold tracking-[-0.02em]"
          >
            Onde isto aparece de verdade
          </h2>
          <p className="text-[13px] text-muted">
            Você já usa isto, talvez sem saber o nome.
          </p>
        </div>
      </div>

      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {itens.map((item) => {
          const conteudo = (
            <>
              <span className="flex items-start gap-2">
                <code className="font-mono text-[13px] font-semibold text-foreground">
                  {item.onde}
                </code>
                {item.href && (
                  <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted transition-transform duration-300 group-hover/onde:-translate-y-0.5 group-hover/onde:translate-x-0.5" />
                )}
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-muted">
                <TextoRico>{item.explicacao}</TextoRico>
              </span>
            </>
          );

          const classe =
            "group/onde block h-full rounded-xl border border-card-border bg-card p-3.5 transition-colors";

          return (
            <li key={item.onde}>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`${classe} hover:border-[color-mix(in_srgb,var(--acento)_45%,transparent)]`}
                >
                  {conteudo}
                </a>
              ) : (
                <div className={classe}>{conteudo}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
