import { Check, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface Props {
  quandoUsar: string[];
  quandoEvitar: string[];
}

function Painel({
  titulo,
  itens,
  cor,
  Icone,
}: {
  titulo: string;
  itens: string[];
  cor: string;
  Icone: typeof Check;
}) {
  return (
    <div
      style={{ ["--sinal" as string]: cor }}
      className="flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card"
    >
      <div className="flex items-center gap-2.5 border-b border-card-border bg-[color-mix(in_srgb,var(--sinal)_9%,transparent)] px-5 py-3.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--sinal)] text-background">
          <Icone className="size-4" strokeWidth={2.75} />
        </span>
        <p className="font-semibold text-[var(--sinal)]">{titulo}</p>
        <span className="ml-auto font-mono text-xs tabular-nums text-muted">
          {itens.length}
        </span>
      </div>
      <ul className="flex-1 divide-y divide-card-border">
        {itens.map((item, i) => (
          <li
            key={i}
            className={cn(
              "flex gap-3 px-5 py-3 text-sm leading-relaxed text-foreground",
              "transition-colors hover:bg-[color-mix(in_srgb,var(--sinal)_6%,transparent)]"
            )}
          >
            <span
              aria-hidden
              className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[var(--sinal)]"
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Painel de decisão: quando o padrão paga o próprio custo — e quando não. */
export function QuandoUsar({ quandoUsar, quandoEvitar }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Painel
        titulo="Use quando"
        itens={quandoUsar}
        cor="var(--ok)"
        Icone={Check}
      />
      <Painel
        titulo="Evite quando"
        itens={quandoEvitar}
        cor="var(--perigo)"
        Icone={X}
      />
    </div>
  );
}
