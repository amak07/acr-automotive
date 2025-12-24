import { ImageResponse } from "next/og";

// Image metadata
export const alt =
  "ACR Automotive - Catálogo Profesional de Mazas y Partes Automotrices";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(220, 38, 38, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(220, 38, 38, 0.08) 0%, transparent 50%)",
            display: "flex",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background:
              "linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)",
            display: "flex",
          }}
        />

        {/* Logo container */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          {/* ACR Text Logo */}
          <div
            style={{
              fontSize: "120px",
              fontWeight: "800",
              color: "#dc2626",
              letterSpacing: "-4px",
              textShadow: "0 4px 20px rgba(220, 38, 38, 0.4)",
              display: "flex",
            }}
          >
            ACR
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "42px",
            fontWeight: "600",
            color: "#ffffff",
            marginBottom: "16px",
            display: "flex",
          }}
        >
          Catálogo Profesional de Autopartes
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span>Mazas</span>
          <span style={{ color: "#dc2626" }}>•</span>
          <span>Baleros</span>
          <span style={{ color: "#dc2626" }}>•</span>
          <span>Juntas Homocinéticas</span>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              color: "#64748b",
              display: "flex",
            }}
          >
            www.acr-automotive.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
