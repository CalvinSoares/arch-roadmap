import Link from "next/link";
import { Map, ArrowRight } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { Reveal } from "@/shared/components/global/ui/reveal";
import { SpotlightCard } from "@/shared/components/global/ui/spotlight-card";
import { SeloNovo } from "@/shared/components/global/ui/selo-novo";
import { listRoadmaps } from "@/shared/lib/content";
import { ehNovo } from "@/shared/lib/novidades";
import { pageMetadata } from "@/shared/lib/seo";

export const metadata = pageMetadata({
  title: "Roadmaps",
  description:
    "Trilhas de aprendizado navegáveis em grafo: padrões de projeto, backend, frontend, arquitetura e sistemas que aguentam produção.",
  path: "/roadmaps",
});

export default function RoadmapsPage() {
  const roadmaps = listRoadmaps();

  return (
    <PageTemplate
      icon={Map}
      title="Roadmaps"
      subtitle="Trilhas de aprendizado navegáveis. Escolha por onde começar."
      breadcrumb={[{ label: "Roadmaps" }]}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {roadmaps.map((r, i) => (
          <Reveal key={r.slug} indice={i} className="h-full">
            <Link href={`/roadmaps/${r.slug}`} className="group block h-full">
              <SpotlightCard
                cor="var(--cat-estrutural)"
                className="flex h-full items-start justify-between gap-4 p-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* h2: filho direto do h1 da página, sem nível intermediário */}
                    <h2 className="font-semibold tracking-tight">{r.titulo}</h2>
                    {ehNovo("roadmap", r.slug) && <SeloNovo />}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {r.descricao}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                    <span className="rounded-full bg-foreground/[0.06] px-2.5 py-1">
                      {r.sections.length} seções
                    </span>
                    <span className="rounded-full bg-foreground/[0.06] px-2.5 py-1">
                      {r.sections.reduce((a, s) => a + s.items.length, 0)} tópicos
                    </span>
                  </div>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-card-border text-primary transition-all duration-300 group-hover:border-primary/45 group-hover:bg-primary/10">
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </SpotlightCard>
            </Link>
          </Reveal>
        ))}
      </div>
    </PageTemplate>
  );
}
