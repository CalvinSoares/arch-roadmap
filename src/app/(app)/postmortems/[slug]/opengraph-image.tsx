import { ImageResponse } from "next/og";
import { POSTMORTEMS } from "@/content/postmortems/registro";
import { OgCard } from "@/shared/lib/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DevMappa — postmortem";

export function generateStaticParams() {
  return POSTMORTEMS.map((p) => ({ slug: p.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pm = POSTMORTEMS.find((p) => p.slug === slug);

  return new ImageResponse(
    (
      <OgCard
        eyebrow={pm?.organizacao ?? "Postmortem"}
        accent="#fb7185"
        title={pm?.titulo ?? "Postmortem"}
        description={pm?.impacto}
        footer="incidente real · conceitos do catálogo"
      />
    ),
    size
  );
}
