import { ImageResponse } from "next/og";
import {
  getComparacao,
  getConceito,
  listComparacoes,
} from "@/shared/lib/content";
import { OgCard } from "@/shared/lib/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DevMappa — comparação";

export function generateStaticParams() {
  return listComparacoes().map((c) => ({ par: c.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ par: string }>;
}) {
  const { par } = await params;
  const c = getComparacao(par);
  const a = c ? getConceito(c.a) : undefined;
  const b = c ? getConceito(c.b) : undefined;
  const titulo = c
    ? `${a?.titulo ?? c.a} × ${b?.titulo ?? c.b}`
    : "Comparação";

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Comparação"
        accent="#c9a227"
        title={titulo}
        description={c?.vereditoRapido.replace(/\*\*/g, "")}
        footer="critério a critério · quando usar cada um"
      />
    ),
    size
  );
}
