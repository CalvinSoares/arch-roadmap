import { ImageResponse } from "next/og";

/**
 * Fallback raster do `icon.svg`. O sufixo `1` é a convenção do Next para
 * declarar um segundo ícone — os dois vão para o `<head>`.
 *
 * Navegadores modernos aceitam favicon em SVG, mas nem todo cliente aceita —
 * leitores de feed, prévias em apps de mensagem e Safari antigo pedem um
 * bitmap. O Next declara os dois no `<head>` e cada um pega o que entende.
 *
 * Desenhado com divs porque o Satori (next/og) não renderiza `<svg>`
 * arbitrário; as proporções acompanham o SVG.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          background: "linear-gradient(135deg, #b4482a 0%, #c9a227 100%)",
        }}
      >
        {/* globo */}
        <div
          style={{
            width: 21,
            height: 21,
            borderRadius: 21,
            border: "3px solid #fff8f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* meridiano */}
          <div
            style={{
              width: 10,
              height: 21,
              borderRadius: 10,
              border: "3px solid #fff8f2",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
