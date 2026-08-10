import { notFound } from "next/navigation";
import { Map } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { RoadmapFlow } from "@/shared/components/diagramas/roadmap-flow";
import { getRoadmap, listRoadmaps } from "@/shared/lib/content";

export function generateStaticParams() {
  return listRoadmaps().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/roadmaps/[slug]">) {
  const { slug } = await params;
  const roadmap = getRoadmap(slug);
  if (!roadmap) return { title: "Roadmap não encontrado" };
  return { title: roadmap.titulo, description: roadmap.descricao };
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
      <RoadmapFlow roadmap={roadmap} />
    </PageTemplate>
  );
}
