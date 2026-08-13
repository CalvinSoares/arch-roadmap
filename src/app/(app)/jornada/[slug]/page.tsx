import { notFound } from "next/navigation";
import Link from "next/link";
import { Waypoints, Map } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { JornadaPath } from "@/shared/components/jornada/jornada-path";
import { RailJornada } from "@/shared/components/jornada/rail-jornada";
import { getRoadmap, listRoadmaps } from "@/shared/lib/content";
import { pageMetadata } from "@/shared/lib/seo";
import { getUsuario } from "@/server/auth/dal";
import { estrelasDoUsuario, bausAbertos } from "@/server/gamificacao/jornada";

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

  // Estrelas e baús abertos do usuário logado; anônimo → vazios.
  const usuario = await getUsuario();
  const refsBau = roadmap.sections
    .filter((s) => s.items.length >= 4)
    .map((s) => `bau:${roadmap.slug}:${s.id}`);
  const [estrelasServidor, bausDoUsuario] = usuario
    ? await Promise.all([
        estrelasDoUsuario(
          usuario.id,
          roadmap.sections.flatMap((s) => s.items.map((it) => it.id))
        ),
        bausAbertos(refsBau),
      ])
    : [{}, []];

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
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
        <JornadaPath
          roadmap={roadmap}
          estrelasServidor={estrelasServidor}
          bausAbertos={bausDoUsuario}
        />
        {/* Rail de jogo (P7): meta, missões e competição ao lado do path. */}
        <aside className="hidden lg:sticky lg:top-20 lg:block">
          <RailJornada />
        </aside>
      </div>
    </PageTemplate>
  );
}
