import { TextoRico } from "@/shared/components/conteudo/texto-rico";

/**
 * Analogia do conceito, mostrada antes da teoria. Tratada como citação
 * destacada: emoji grande em ladrilho, etiqueta e texto em corpo maior.
 */
export function Analogia({
  emoji,
  titulo,
  texto,
}: {
  emoji: string;
  titulo: string;
  texto: string;
}) {
  return (
    <figure className="relative overflow-hidden rounded-2xl border border-card-border bg-card p-5 pl-6 sm:p-6 sm:pl-7">
      {/* filete de acento na lateral */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-[var(--acento)]"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--acento)_12%,transparent)] text-[28px] leading-none"
        >
          {emoji}
        </span>
        <div className="min-w-0">
          <figcaption className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--acento)]">
            Analogia
          </figcaption>
          <p className="mt-1.5 text-lg font-semibold leading-snug tracking-tight">
            {titulo}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-muted"><TextoRico>{texto}</TextoRico></p>
        </div>
      </div>
    </figure>
  );
}
