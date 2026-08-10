import { cn } from "@/shared/utils/cn";
import type { EstruturaBloco } from "@/shared/types/bloco";

interface Props {
  blocos: EstruturaBloco[];
  legenda: string;
}

/** Profundidade máxima com recuo visível antes de a caixa ficar estreita demais. */
const NIVEL_MAX = 3;

function Bloco({ bloco, nivel }: { bloco: EstruturaBloco; nivel: number }) {
  const temFilhos = !!bloco.filhos?.length;
  const recuado = Math.min(nivel, NIVEL_MAX);

  return (
    <li className="min-w-0">
      <div
        className={cn(
          "rounded-xl border transition-colors",
          bloco.opcional ? "border-dashed" : "border-solid",
          bloco.destaque
            ? "border-[var(--acento)] bg-[color-mix(in_srgb,var(--acento)_10%,transparent)]"
            : "border-card-border bg-background",
          // caixas mais internas ganham um respiro menor
          recuado === 0 ? "p-3 sm:p-3.5" : "p-2.5 sm:p-3"
        )}
      >
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "text-[13px] font-medium",
              bloco.destaque ? "text-[var(--acento)]" : "text-foreground"
            )}
          >
            {bloco.label}
          </span>
          {bloco.nota && (
            <span
              className={cn(
                "text-[11px] leading-snug",
                // sobre o fundo tingido do destaque, `text-muted` fica em 4.18:1
                bloco.destaque ? "text-foreground/85" : "text-muted"
              )}
            >
              {bloco.nota}
            </span>
          )}
        </p>

        {temFilhos && (
          <ul className="mt-2.5 space-y-2 border-l-2 border-card-border pl-2.5 sm:pl-3">
            {bloco.filhos!.map((f) => (
              <Bloco key={f.id} bloco={f} nivel={nivel + 1} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/**
 * Caixas aninhadas/empilhadas — o arquétipo "estrutura" do sistema de
 * ilustrações. Onde `fluxo` mostra uma sequência no tempo, este mostra
 * **contenção**: quem embrulha quem, quem esconde o quê, o que está dentro
 * da fronteira do conceito.
 *
 * O aninhamento é puramente semântico (listas dentro de listas), então
 * leitores de tela anunciam a hierarquia sem precisar de ARIA extra, e o
 * layout nunca rola horizontalmente — as caixas internas encolhem.
 */
export function IlustracaoEstrutura({ blocos, legenda }: Props) {
  return (
    <figure className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
      <ul className="space-y-2.5">
        {blocos.map((b) => (
          <Bloco key={b.id} bloco={b} nivel={0} />
        ))}
      </ul>

      <figcaption className="mt-5 border-t border-card-border pt-3 text-center text-[13px] leading-relaxed text-muted">
        {legenda}
      </figcaption>
    </figure>
  );
}
