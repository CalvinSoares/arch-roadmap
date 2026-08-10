import { Check, X } from "lucide-react";

interface Props {
  quandoUsar: string[];
  quandoEvitar: string[];
}

/** Grid de prós/contras: quando usar × quando evitar. */
export function QuandoUsar({ quandoUsar, quandoEvitar }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-card-border bg-card p-5">
        <p className="mb-3 flex items-center gap-2 font-medium text-cat-criacional">
          <Check className="size-4" /> Use quando
        </p>
        <ul className="space-y-2 text-sm text-foreground">
          {quandoUsar.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cat-criacional" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-card-border bg-card p-5">
        <p className="mb-3 flex items-center gap-2 font-medium text-cat-arquitetura">
          <X className="size-4" /> Evite quando
        </p>
        <ul className="space-y-2 text-sm text-foreground">
          {quandoEvitar.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cat-arquitetura" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
