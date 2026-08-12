import type { ReactElement } from "react";

type OgCardProps = {
  eyebrow?: string;
  accent?: string;
  title: string;
  description?: string;
  footer?: string;
};

/**
 * Layout compartilhado das imagens Open Graph (1200×630) — Satori/ImageResponse.
 */
export function OgCard({
  eyebrow,
  accent = "#b4482a",
  title,
  description,
  footer = "DevMappa · padrões · arquitetura · roadmaps",
}: OgCardProps): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#100d0b",
        color: "#f2ece4",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #b4482a 0%, #c9a227 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 22,
              border: "3px solid rgba(255, 248, 242, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 10,
                height: 22,
                borderRadius: 10,
                border: "3px solid rgba(255, 248, 242, 0.85)",
              }}
            />
          </div>
        </div>
        <span style={{ fontSize: 32, fontWeight: 600 }}>DevMappa</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {eyebrow ? (
          <span
            style={{
              alignSelf: "flex-start",
              fontSize: 24,
              color: accent,
              border: `2px solid ${accent}`,
              borderRadius: 999,
              padding: "6px 20px",
              display: "flex",
            }}
          >
            {eyebrow}
          </span>
        ) : null}
        <span
          style={{
            fontSize: title.length > 42 ? 58 : 72,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 1000,
          }}
        >
          {title}
        </span>
        {description ? (
          <span
            style={{
              fontSize: 30,
              color: "#a39387",
              lineHeight: 1.35,
              maxWidth: 980,
            }}
          >
            {description.length > 140
              ? `${description.slice(0, 137)}…`
              : description}
          </span>
        ) : null}
      </div>

      <span style={{ fontSize: 24, color: "#a39387" }}>{footer}</span>
    </div>
  );
}
