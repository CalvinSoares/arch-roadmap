import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DevMappa — estude padrões e arquitetura visualmente";

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
          background: "#100d0b",
          color: "#f2ece4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* mesma marca do favicon: globo sobre o gradiente da identidade */}
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 20,
              background: "linear-gradient(135deg, #b4482a 0%, #c9a227 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 40,
                border: "5px solid rgba(255, 248, 242, 0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 40,
                  borderRadius: 20,
                  border: "5px solid rgba(255, 248, 242, 0.85)",
                }}
              />
            </div>
          </div>
          <span style={{ fontSize: 64, fontWeight: 700 }}>DevMappa</span>
        </div>
        <span style={{ fontSize: 40, color: "#f2ece4", textAlign: "center" }}>
          Estude padrões e arquitetura visualmente
        </span>
        <span style={{ fontSize: 28, color: "#a39387" }}>
          roadmaps · conceitos interativos · construtor de projetos
        </span>
      </div>
    ),
    size
  );
}
