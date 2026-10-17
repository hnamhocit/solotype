import type React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export const SoloTypeIcon: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 32, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
      aria-label="SoloType Logo Mark"
    >
      <defs>
        <linearGradient
          id="soloTypeIconGrad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="var(--color-primary, #10b981)" />
          <stop offset="60%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        <linearGradient
          id="soloTypeKeycapGrad"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="var(--bg-sub, #1e293b)" />
          <stop offset="100%" stopColor="var(--bg-card, #090d16)" />
        </linearGradient>

        <linearGradient id="soloTypeDishGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor="var(--color-primary, #10b981)"
            stopOpacity="0.12"
          />
          <stop
            offset="100%"
            stopColor="var(--bg-main, #0f172a)"
            stopOpacity="0.8"
          />
        </linearGradient>

        <filter id="soloTypeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Keycap Outer Base */}
      <rect
        x="5"
        y="5"
        width="54"
        height="54"
        rx="14"
        fill="url(#soloTypeKeycapGrad)"
        stroke="var(--border-color, #334155)"
        strokeWidth="1.5"
      />

      {/* Keycap Top Dish Inset */}
      <rect
        x="9"
        y="8"
        width="46"
        height="44"
        rx="10"
        fill="url(#soloTypeDishGrad)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* High-Speed "S" Ribbon & Typing Stroke */}
      <path
        d="M 40 21.5 L 28 21.5 C 22.5 21.5 19 24 19 27.5 C 19 31 22 33 27 34 L 37 36 C 42.5 37.2 45 39.5 45 43.5 C 45 47.8 41 50.5 34 50.5 L 21 50.5"
        fill="none"
        stroke="url(#soloTypeIconGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#soloTypeGlow)"
      />

      {/* Active Terminal Caret Accent on top-right */}
      <rect
        x="42"
        y="17"
        width="3.5"
        height="8.5"
        rx="1.5"
        fill="var(--color-primary, #10b981)"
        className="animate-pulse"
      />

      {/* Left Bottom Prompt Dot Accent */}
      <circle cx="16.5" cy="50.5" r="2" fill="#06b6d4" opacity="0.9" />
    </svg>
  );
};

export const SoloTypeLogo: React.FC<LogoProps> = ({
  className = "",
  size = 28,
  showWordmark = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <SoloTypeIcon size={size} />
      {showWordmark && (
        <div className="flex items-center text-xl font-bold tracking-tight font-mono">
          <span style={{ color: "var(--color-primary, #10b981)" }}>solo</span>
          <span style={{ color: "var(--text-main, #f8fafc)" }}>type</span>
          <span
            className="inline-block w-2.5 h-5 ml-1 animate-caret rounded-xs"
            style={{ backgroundColor: "var(--color-primary, #10b981)" }}
          />
        </div>
      )}
    </div>
  );
};
