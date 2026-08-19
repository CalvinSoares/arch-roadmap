import Link from "next/link";
import { Siren, ArrowUpRight } from "lucide-react";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { postmortemsDoConceito } from "@/shared/lib/content";

/**
 * "Onde isto já custou caro": os incidentes públicos que este conceito
 * explica. Derivado do registro de postmortems, nunca declarado aqui.
 */
export function EmPostmortems({ slug }: { slug: string }) {
  const incidentes = postmortemsDoConceito(slug);
  if (incidentes.length === 0) return null;

  return (
    <section aria-labelledby="em-postmortems">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-lg"
          style={{
            background: "color-mix(in srgb, var(--perigo) 14%, transparent)",
            color: "var(--perigo)",
          }}
        >
          <Siren className="size-4" />
        </span>
        <div>
          <h2
            id="em-postmortems"
            className="text-lg font-semibold tracking-[-0.02em]"
          >
            Onde isto já custou caro
          </h2>
          <p className="text-[13px] text-muted">
            Incidentes reais que este conceito explica.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {incidentes.map((i) => (
          <li key={i.slug}>
            <Link
              href={`/postmortems/${i.slug}`}
              className="group/pm block rounded-xl border border-card-border bg-card p-4 transition-colors hover:border-primary/45"
            >
              <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
                <span className="font-semibold">{i.organizacao}</span>
              </span>
              <span className="mt-1 flex items-start gap-1.5 font-semibold leading-snug">
                {i.titulo}
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 opacity-60 transition-transform duration-300 group-hover/pm:-translate-y-0.5 group-hover/pm:translate-x-0.5" />
              </span>
              <span className="mt-1.5 block text-[14px] leading-relaxed text-muted">
                <TextoRico>{i.porque}</TextoRico>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
