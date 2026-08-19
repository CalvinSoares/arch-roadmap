/**
 * Trilha de passos numerados. O conector vive na primeira coluna do grid
 * (atrás das medalhas) em vez de pendurado em margem negativa; assim nada
 * escapa da caixa nem passa por cima do conteúdo vizinho.
 */
export function Passos({
  passos,
}: {
  passos: { titulo: string; texto: string }[];
}) {
  return (
    <ol className="flex flex-col">
      {passos.map((p, i) => {
        const ultimo = i === passos.length - 1;
        return (
          <li
            key={i}
            className="group/passo grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4"
          >
            {/* coluna da medalha + conector */}
            <div className="relative flex flex-col items-center">
              <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--acento)] font-mono text-[13px] font-bold text-background shadow-[0_4px_12px_-4px_color-mix(in_srgb,var(--acento)_75%,transparent)]">
                {i + 1}
              </span>
              {!ultimo && (
                <span
                  aria-hidden
                  className="w-px flex-1 bg-gradient-to-b from-[color-mix(in_srgb,var(--acento)_45%,transparent)] to-card-border"
                />
              )}
            </div>

            {/* conteúdo do passo */}
            <div className={ultimo ? "pb-0 pt-1" : "pb-6 pt-1"}>
              <p className="font-semibold leading-snug">{p.titulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.texto}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
