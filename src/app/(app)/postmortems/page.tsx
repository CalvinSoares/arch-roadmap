import Link from "next/link";
import { Siren, ArrowUpRight } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { POSTMORTEMS } from "@/content/postmortems/registro";
import { getConceito } from "@/shared/lib/content";

import { pageMetadata } from "@/shared/lib/seo";

export const metadata = pageMetadata({
  title: "Postmortems",
  description:
    "Incidentes públicos que custaram horas de queda e milhões de dólares, anotados com os conceitos do catálogo. A prova de que os padrões importam.",
  path: "/postmortems",
});

export default function PostmortemsPage() {
  return (
    <PageTemplate
      icon={Siren}
      title="Postmortems anotados"
      subtitle="Incidentes reais, com relatório público, ligados aos conceitos que eles provam. Em quase todos, o problema de verdade foi o sistema deixar um erro pequeno crescer daquele jeito."
      breadcrumb={[{ label: "Postmortems" }]}
    >
      <ul className="grid gap-4 lg:grid-cols-2">
        {POSTMORTEMS.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/postmortems/${p.slug}`}
              className="group/pm flex h-full flex-col rounded-2xl border border-card-border bg-card p-5 transition-colors hover:border-primary/45"
            >
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <span className="font-semibold">{p.organizacao}</span>
                <span aria-hidden>·</span>
                <time>{p.quando.rotulo}</time>
              </div>

              <h2 className="mt-2 text-lg font-semibold leading-snug tracking-[-0.02em]">
                {p.titulo}
                <ArrowUpRight className="ml-1 inline size-4 opacity-60 transition-transform duration-300 group-hover/pm:-translate-y-0.5 group-hover/pm:translate-x-0.5" />
              </h2>

              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {p.impacto}
              </p>

              <ul className="mt-4 flex flex-wrap gap-1.5 pt-1">
                {p.conceitos.map((c) => {
                  const conceito = getConceito(c.slug);
                  return (
                    <li
                      key={c.slug}
                      className="rounded-md bg-foreground/[0.05] px-2 py-1 text-[11px] font-medium text-muted"
                    >
                      {conceito?.titulo ?? c.slug}
                    </li>
                  );
                })}
              </ul>
            </Link>
          </li>
        ))}
      </ul>
    </PageTemplate>
  );
}
