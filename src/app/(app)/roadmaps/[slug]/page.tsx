import { notFound } from "next/navigation";
import Link from "next/link";
import { Map, Waypoints } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { RoadmapFlow } from "@/shared/components/diagramas/roadmap-flow";
import { MapaDeFases } from "@/shared/components/diagramas/mapa-de-fases";
import { getRoadmap, listRoadmaps } from "@/shared/lib/content";
import { pageMetadata, breadcrumbJsonLd, courseJsonLd } from "@/shared/lib/seo";
import { JsonLd } from "@/shared/components/seo/json-ld";

export function generateStaticParams() {
  return listRoadmaps().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/roadmaps/[slug]">) {
  const { slug } = await params;
  const roadmap = getRoadmap(slug);
  if (!roadmap) {
    return pageMetadata({
      title: "Roadmap não encontrado",
      description: "Esta trilha não existe ou foi movida.",
      path: `/roadmaps/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: roadmap.titulo,
    description: roadmap.descricao,
    path: `/roadmaps/${roadmap.slug}`,
    type: "article",
  });
}

export default async function RoadmapPage({
  params,
}: PageProps<"/roadmaps/[slug]">) {
  const { slug } = await params;
  const roadmap = getRoadmap(slug);
  if (!roadmap) notFound();

  return (
    <PageTemplate
      icon={Map}
      title={roadmap.titulo}
      subtitle={roadmap.descricao}
      breadcrumb={[
        { label: "Roadmaps", href: "/roadmaps" },
        { label: roadmap.titulo },
      ]}
      actions={
        <Link
          href={`/jornada/${roadmap.slug}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
        >
          <Waypoints className="size-4 text-[var(--glow-c)]" />
          Ver como jornada
        </Link>
      }
    >
      <JsonLd
        data={[
          courseJsonLd({
            title: roadmap.titulo,
            description: roadmap.descricao,
            path: `/roadmaps/${roadmap.slug}`,
          }),
          breadcrumbJsonLd([
            { name: "Início", path: "/" },
            { name: "Roadmaps", path: "/roadmaps" },
            { name: roadmap.titulo, path: `/roadmaps/${roadmap.slug}` },
          ]),
        ]}
      />
      <RoadmapFlow roadmap={roadmap} />

      <details className="mt-6 rounded-2xl border border-card-border bg-card">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-foreground marker:content-none">
          🗺️ Mapa de fases
          <span className="ml-2 font-normal text-muted">
            — a trilha como fases com desbloqueio
          </span>
        </summary>
        <div className="border-t border-card-border p-4">
          <MapaDeFases roadmap={roadmap} />
        </div>
      </details>
    </PageTemplate>
  );
}
