import { Briefcase, Scale } from "lucide-react";
import type { CasoDeUso } from "@/shared/types/bloco";

/** Cards de casos de uso reais: cenário → como o padrão entra → trade-off. */
export function CasosDeUso({ casos }: { casos: CasoDeUso[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {casos.map((c) => (
        <article
          key={c.titulo}
          className="flex flex-col rounded-xl border border-card-border bg-card p-5"
        >
          <p className="flex items-center gap-2 font-medium">
            <Briefcase className="size-4 shrink-0 text-primary" />
            {c.titulo}
          </p>
          <p className="mt-2 text-sm text-muted">{c.cenario}</p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
            {c.aplicacao}
          </p>
          <p className="mt-3 flex gap-2 rounded-lg bg-muted/8 p-3 text-xs leading-relaxed text-muted">
            <Scale className="mt-0.5 size-3.5 shrink-0" />
            <span>
              <b className="text-foreground">Trade-off:</b> {c.tradeoff}
            </span>
          </p>
        </article>
      ))}
    </div>
  );
}

/** Lista de armadilhas/erros comuns. */
export function Armadilhas({ itens }: { itens: { titulo: string; texto: string }[] }) {
  return (
    <ul className="space-y-3">
      {itens.map((a) => (
        <li
          key={a.titulo}
          className="rounded-xl border border-cat-arquitetura/30 bg-cat-arquitetura/6 p-4"
        >
          <p className="font-medium text-cat-arquitetura">{a.titulo}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{a.texto}</p>
        </li>
      ))}
    </ul>
  );
}
