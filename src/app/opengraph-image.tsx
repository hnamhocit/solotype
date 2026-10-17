import { ImageResponse } from "next/og";

export const alt = "SoloType — Minimalist Spaced Repetition Typing";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 70px",
        backgroundColor: "#090d16",
        backgroundImage:
          "radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.18) 0%, transparent 50%), radial-gradient(circle at 15% 85%, rgba(6, 182, 212, 0.14) 0%, transparent 50%)",
        fontFamily: "monospace",
        color: "#f8fafc",
        position: "relative",
      }}
    >
      {/* Subtle Decorative Grid lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          margin: "24px",
          borderRadius: "28px",
          pointerEvents: "none",
        }}
      />

      {/* Top Navbar Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* SVG Keycap Icon */}
          <svg
            width="54"
            height="54"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>SoloType Icon</title>
            <rect
              x="4"
              y="4"
              width="56"
              height="56"
              rx="14"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="2"
            />
            <rect
              x="8"
              y="7"
              width="48"
              height="46"
              rx="10"
              fill="#0f172a"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            <path
              d="M 41 21 L 28 21 C 22.5 21 19 23.8 19 27.5 C 19 31 22 33 27 34 L 37 36 C 42.5 37.2 45 39.5 45 43.5 C 45 47.8 41 50.5 34 50.5 L 21 50.5"
              fill="none"
              stroke="#10b981"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="43"
              y="16.5"
              width="3.5"
              height="9"
              rx="1.5"
              fill="#10b981"
            />
            <circle cx="16" cy="50.5" r="2.2" fill="#06b6d4" />
          </svg>

          {/* Brand Text */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "34px",
              fontWeight: "bold",
            }}
          >
            <span style={{ color: "#10b981" }}>solo</span>
            <span style={{ color: "#f8fafc" }}>type</span>
            <span
              style={{
                display: "flex",
                width: "5px",
                height: "28px",
                marginLeft: "4px",
                backgroundColor: "#10b981",
              }}
            />
          </div>
        </div>

        {/* Version / Open-source Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 18px",
            borderRadius: "9999px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          v1.1 • Spaced & Reflex Typing
        </div>
      </div>

      {/* Center Hero Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "980px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            fontSize: "54px",
            fontWeight: "800",
            lineHeight: 1.15,
            letterSpacing: "-1.5px",
            color: "#ffffff",
          }}
        >
          <span>Type faster, think clearer.</span>
          <span style={{ color: "#10b981" }}>
            Zero backspace. Real spaced repetition.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: "22px",
            color: "#94a3b8",
            lineHeight: 1.45,
          }}
        >
          A minimalist typing engine that prioritizes your weak keys and error
          debt. Features single letter reflex training, visual flash memory, and
          mechanical switch audio.
        </div>
      </div>

      {/* Bottom Feature Badges & Credits */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          paddingTop: "24px",
          width: "100%",
        }}
      >
        {/* Feature Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 14px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#e2e8f0",
              fontSize: "14px",
            }}
          >
            🧠 Spaced Repetition (5k Words)
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 14px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#e2e8f0",
              fontSize: "14px",
            }}
          >
            🔤 Single Letter Drill
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 14px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#e2e8f0",
              fontSize: "14px",
            }}
          >
            👁️ Flash & Type
          </div>
        </div>

        {/* Author info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "16px",
            color: "#94a3b8",
          }}
        >
          <span>by</span>
          <span style={{ color: "#f8fafc", fontWeight: "bold" }}>
            @hnamhocit
          </span>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
