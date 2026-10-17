"use client";

import { MousePointerClick } from "lucide-react";
import type React from "react";

interface FocusNoticeProps {
  isFocused: boolean;
  onFocus: () => void;
}

export const FocusNotice: React.FC<FocusNoticeProps> = ({
  isFocused,
  onFocus,
}) => {
  if (isFocused) return null;

  return (
    <button
      type="button"
      onClick={onFocus}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-[2px] cursor-pointer rounded-xl transition-all border-0 bg-black/60 w-full h-full"
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium shadow-2xl transition-transform hover:scale-105"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
          color: "var(--color-primary)",
        }}
      >
        <MousePointerClick className="w-4 h-4 animate-bounce" />
        <span>Click or press any key to focus</span>
      </div>
    </button>
  );
};
