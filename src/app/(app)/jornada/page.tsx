import Link from "next/link";
import { Waypoints, ChevronRight } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { pageMetadata } from "@/shared/lib/seo";
import { listRoadmaps } from "@/shared/lib/content";

export const metadata = pageMetadata({
  title: "Jornada",
  description:
    "Aprenda em trilha: cada roadmap vira uma jornada de fases com desbloqueio.",
  path: "/jornada",
});

export default function JornadaIndexPage() {
  const roadmaps = listRoadmaps();

  return (
    <PageTemplate
      icon={Waypoints}
      title="Jornada"
      subtitle="Escolha uma trilha e avance fase a fase. Cada nó abre o conteúdo e conta pro seu progresso."
      breadcrumb={[{ label: "Jornada" }]}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {roadmaps.map((r) => {
          const nos = r.sections.reduce((n, s) => n + s.items.length, 0);
          return (
            <Link
              key={r.slug}
              href={`/jornada/${r.slug}`}
              className="group flex flex-col rounded-2xl border border-card-border bg-card p-5 transition-all hover:border-primary/45 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-foreground">{r.titulo}</h2>
                <ChevronRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] text-muted">
                {r.descricao}
              </p>
              <span className="mt-3 text-[12px] font-medium text-muted">
                {r.sections.length} unidades · {nos} nós
              </span>
            </Link>
          );
        })}
      </div>
    </PageTemplate>
  );
}
