import { ImageResponse } from "next/og";
import { getRoadmap, listRoadmaps } from "@/shared/lib/content";
import { OgCard } from "@/shared/lib/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DevMappa — roadmap";

export function generateStaticParams() {
  return listRoadmaps().map((r) => ({ slug: r.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const roadmap = getRoadmap(slug);

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Roadmap"
        accent="#60a5fa"
        title={roadmap?.titulo ?? "Roadmap"}
        description={roadmap?.descricao}
        footer="trilha navegável · progresso no navegador"
      />
    ),
    size
  );
}
