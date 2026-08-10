import {
  FileDown,
  GitCompareArrows,
  GraduationCap,
  CircleHelp,
  Telescope,
  type LucideIcon,
} from "lucide-react";
import { A_SEGUIR } from "@/content/novidades/registro";

/**
 * Ícone por id do item planejado. O conteúdo não conhece lucide de propósito
 * — um id sem ícone mapeado cai no telescópio, e nada quebra.
 */
const ICONE: Record<string, LucideIcon> = {
  adr: FileDown,
  comparador: GitCompareArrows,
  "modo-estudo": GraduationCap,
  quiz: CircleHelp,
};

/**
 * O que está planejado e ainda não saiu. Deliberadamente sem data e sem
 * ordem de promessa: é direção, não cronograma.
 */
export function ASeguir() {
  if (A_SEGUIR.length === 0) return null;

  return (
    <section
      aria-labelledby="a-seguir-titulo"
      className="mb-10 rounded-2xl border border-dashed border-card-border bg-card/50 p-5 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Telescope className="size-4 text-primary" />
        <h2
          id="a-seguir-titulo"
          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
        >
          A seguir
        </h2>
      </div>
      <p className="mt-1.5 text-sm text-muted">
        Em que estamos trabalhando — sem data marcada, na ordem que fizer
        sentido.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {A_SEGUIR.map((item) => {
          const Icone = ICONE[item.id] ?? Telescope;
          return (
            <li
              key={item.id}
              className="flex gap-3 rounded-xl border border-card-border bg-background p-3.5"
            >
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10">
                <Icone className="size-4 text-primary" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold leading-snug">
                  {item.titulo}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  {item.descricao}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
