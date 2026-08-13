import { notFound } from "next/navigation";
import Link from "next/link";
import { Waypoints, Map } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { JornadaPath } from "@/shared/components/jornada/jornada-path";
import { getRoadmap, listRoadmaps } from "@/shared/lib/content";
import { pageMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return listRoadmaps().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/jornada/[slug]">) {
  const { slug } = await params;
  const roadmap = getRoadmap(slug);
  if (!roadmap) {
    return pageMetadata({
      title: "Jornada não encontrada",
      description: "Esta trilha não existe.",
      path: `/jornada/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: `Jornada · ${roadmap.titulo}`,
    description: `Avance fase a fase pela trilha de ${roadmap.titulo}.`,
    path: `/jornada/${roadmap.slug}`,
  });
}

export default async function JornadaRoadmapPage({
  params,
}: PageProps<"/jornada/[slug]">) {
  const { slug } = await params;
  const roadmap = getRoadmap(slug);
  if (!roadmap) notFound();

  return (
    <PageTemplate
      icon={Waypoints}
      title={roadmap.titulo}
      subtitle="Sua trilha. Comece pelo nó destacado e vá desbloqueando o resto."
      breadcrumb={[
        { label: "Jornada", href: "/jornada" },
        { label: roadmap.titulo },
      ]}
      actions={
        <Link
          href={`/roadmaps/${roadmap.slug}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
        >
          <Map className="size-4" />
          Ver mapa completo
        </Link>
      }
    >
      <JornadaPath roadmap={roadmap} />
    </PageTemplate>
  );
}
