import { ImageResponse } from "next/og";
import { getConceito, listConceitos } from "@/shared/lib/content";
import { CATEGORIAS } from "@/shared/config/categorias";
import type { Categoria } from "@/shared/types/conceito";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DevAtlas — conceito";

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
  // o mesmo --cat-infra do tema escuro (ImageResponse não lê CSS vars)
  infra: "#89bdd1",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const conceito = getConceito(slug);
  const cor = conceito ? COR[conceito.categoria] : "#7c7bff";
  const label = conceito ? CATEGORIAS[conceito.categoria].label : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0b0d16",
          color: "#e7e9f3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "#7c7bff",
              display: "flex",
            }}
          />
          <span style={{ fontSize: 34, fontWeight: 600 }}>DevAtlas</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span
            style={{
              alignSelf: "flex-start",
              fontSize: 28,
              color: cor,
              border: `2px solid ${cor}`,
              borderRadius: 999,
              padding: "6px 22px",
              display: "flex",
            }}
          >
            {label}
          </span>
          <span style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>
            {conceito?.titulo ?? "Conceito"}
          </span>
          <span style={{ fontSize: 32, color: "#9aa1bd", lineHeight: 1.4 }}>
            {conceito?.resumo.slice(0, 120) ?? ""}
          </span>
        </div>

        <span style={{ fontSize: 26, color: "#9aa1bd" }}>
          diagramas · camadas navegáveis · código · demos interativas
        </span>
      </div>
    ),
    size
  );
}
