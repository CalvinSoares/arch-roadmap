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
 * Ícone por id do item planejado. O conteúdo não conhece lucide de propósito:
 * um id sem ícone mapeado cai no telescópio e nada quebra.
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
      className="mb-8 min-w-0 rounded-2xl border border-dashed border-card-border bg-card/50 p-3.5 sm:mb-10 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Telescope className="size-4 shrink-0 text-primary" />
        <h2
          id="a-seguir-titulo"
          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
        >
          A seguir
        </h2>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted sm:text-sm">
        Em que estamos trabalhando, sem data marcada e na ordem que fizer
        sentido.
      </p>

      <ul className="mt-3.5 grid gap-2.5 sm:mt-4 sm:grid-cols-2 sm:gap-3">
        {A_SEGUIR.map((item) => {
          const Icone = ICONE[item.id] ?? Telescope;
          return (
            <li
              key={item.id}
              className="flex min-w-0 gap-2.5 rounded-xl border border-card-border bg-background p-3 sm:gap-3 sm:p-3.5"
            >
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 sm:size-8">
                <Icone className="size-3.5 text-primary sm:size-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold leading-snug">
                  {item.titulo}
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-muted sm:text-[13px]">
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
