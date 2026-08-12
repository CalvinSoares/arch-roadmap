import { ImageResponse } from "next/og";
import { getConceito, listConceitos } from "@/shared/lib/content";
import { CATEGORIAS } from "@/shared/config/categorias";
import { OgCard } from "@/shared/lib/og-card";
import type { Categoria } from "@/shared/types/conceito";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DevMappa — conceito";

export function generateStaticParams() {
  return listConceitos().map((c) => ({ slug: c.slug }));
}

/** Cores sólidas por categoria (ImageResponse não lê CSS vars). */
const COR: Record<Categoria, string> = {
  criacional: "#34d399",
  estrutural: "#60a5fa",
  comportamental: "#a78bfa",
  principio: "#fbbf24",
  arquitetura: "#fb7185",
  resiliencia: "#b39ce8",
  dados: "#e79ade",
  infra: "#89bdd1",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const conceito = getConceito(slug);
  const cor = conceito ? COR[conceito.categoria] : "#b4482a";
  const label = conceito ? CATEGORIAS[conceito.categoria].label : "Conceito";

  return new ImageResponse(
    (
      <OgCard
        eyebrow={label}
        accent={cor}
        title={conceito?.titulo ?? "Conceito"}
        description={conceito?.resumo}
        footer="diagramas · camadas navegáveis · código · demos"
      />
    ),
    size
  );
}
