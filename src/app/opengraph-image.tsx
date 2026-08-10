import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DevAtlas — estude padrões e arquitetura visualmente";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#0b0d16",
          color: "#e7e9f3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#7c7bff",
              display: "flex",
            }}
          />
          <span style={{ fontSize: 56, fontWeight: 700 }}>DevAtlas</span>
        </div>
        <span style={{ fontSize: 40, color: "#e7e9f3", textAlign: "center" }}>
          Estude padrões e arquitetura visualmente
        </span>
        <span style={{ fontSize: 28, color: "#9aa1bd" }}>
          roadmaps · conceitos interativos · construtor de projetos
        </span>
      </div>
    ),
    size
  );
}
