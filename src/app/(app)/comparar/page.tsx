import Link from "next/link";
import { GitCompareArrows, ArrowUpRight } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { CATEGORIAS } from "@/shared/config/categorias";
import { listComparacoes, getConceito } from "@/shared/lib/content";

export const metadata = {
  title: "Comparações",
  description:
    "Os pares de padrões que mais se confundem, lado a lado: Proxy × Decorator, Strategy × Template Method, State × Strategy e outros.",
};

export default function CompararPage() {
  const comparacoes = listComparacoes();

  return (
    <PageTemplate
      icon={GitCompareArrows}
      title="Comparações"
      subtitle="Os pares que mais se confundem, resolvidos lado a lado."
      breadcrumb={[{ label: "Comparações" }]}
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {comparacoes.map((c) => {
          const a = getConceito(c.a);
          const b = getConceito(c.b);
          if (!a || !b) return null;
          return (
            <li key={c.slug}>
              <Link
                href={`/comparar/${c.slug}`}
                className="group/cmp flex h-full flex-col rounded-2xl border border-card-border bg-card p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[var(--shadow-md)]"
              >
                <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: CATEGORIAS[a.categoria].cssVar }}
                  />
                  {a.titulo}
                  <span className="text-muted">×</span>
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: CATEGORIAS[b.categoria].cssVar }}
                  />
                  {b.titulo}
                  <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted transition-transform duration-300 group-hover/cmp:-translate-y-0.5 group-hover/cmp:translate-x-0.5" />
                </span>
                <span className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                  {c.vereditoRapido.replace(/\*\*/g, "")}
                </span>
                <span className="mt-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
                  {c.criterios.length} critérios
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </PageTemplate>
  );
}
