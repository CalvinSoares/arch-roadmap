import { ImageResponse } from "next/og";

/**
 * Ícone do atalho em iOS. Precisa ser opaco e sem cantos próprios — o sistema
 * aplica a máscara. Mesma marca do `icon.svg`, redesenhada com divs porque o
 * Satori (next/og) não renderiza `<svg>` arbitrário.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #b4482a 0%, #c9a227 100%)",
        }}
      >
        {/* globo */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 96,
            border: "11px solid rgba(255, 248, 242, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* meridiano */}
          <div
            style={{
              width: 48,
              height: 96,
              borderRadius: 48,
              border: "11px solid rgba(255, 248, 242, 0.85)",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
