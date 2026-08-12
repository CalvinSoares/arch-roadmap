import { notFound } from "next/navigation";
import { Map } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { RoadmapFlow } from "@/shared/components/diagramas/roadmap-flow";
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
    </PageTemplate>
  );
}
