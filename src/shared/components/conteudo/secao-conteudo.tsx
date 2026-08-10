import { cn } from "@/shared/utils/cn";

interface SecaoConteudoProps {
  id?: string;
  /** Posição na trilha de leitura — vira "01", "02"… */
  numero?: number;
  /** Rótulo curto do tipo de seção ("Conceito", "Interativo"…). */
  etiqueta?: string;
  titulo: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Cabeçalho canônico de toda seção do conceito. Manter uma única forma
 * (número + etiqueta + filete + título) é o que dá ritmo à leitura: o leitor
 * sempre sabe que começou um bloco novo e em que ponto da trilha está.
 *
 * A cor de acento vem de `--acento`, definida uma vez no artigo.
 */
export function SecaoConteudo({
  id,
  numero,
  etiqueta,
  titulo,
  children,
  className,
}: SecaoConteudoProps) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <header className="mb-5">
        <div className="flex items-center gap-3">
          {numero !== undefined && (
            <span className="font-mono text-xs font-bold tabular-nums text-[var(--acento)]">
              {String(numero).padStart(2, "0")}
            </span>
          )}
          {etiqueta && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {etiqueta}
            </span>
          )}
          <span aria-hidden className="h-px flex-1 bg-card-border" />
        </div>
        <h2 className="mt-2.5 text-[22px] font-semibold leading-tight tracking-[-0.02em]">
          {titulo}
        </h2>
      </header>
      {children}
    </section>
  );
}

/**
 * Figura de apoio — ilustrações e passos que pertencem à seção anterior.
 * Sem número: não é um novo degrau da trilha, é o mesmo assunto ilustrado.
 */
export function FiguraApoio({
  etiqueta,
  titulo,
  children,
  className,
}: {
  etiqueta?: string;
  titulo?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {(etiqueta || titulo) && (
        <div className="flex items-center gap-2">
          {etiqueta && (
            <span className="rounded-md bg-[color-mix(in_srgb,var(--acento)_14%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--acento)]">
              {etiqueta}
            </span>
          )}
          {titulo && <span className="text-sm font-medium">{titulo}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
