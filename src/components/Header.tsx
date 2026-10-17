"use client";

import {
  Brain,
  EyeOff,
  Flame,
  Moon,
  Palette,
  RotateCcw,
  Sun,
  Type,
  Volume2,
  VolumeX,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { AppTheme, FontSize, SoundProfile } from "@/lib/types";
import { useTypingStore } from "@/store/useTypingStore";
import { CustomConfigModal, type CustomConfigType } from "./CustomConfigModal";
import { GithubIcon } from "./GithubIcon";
import { SoloTypeLogo } from "./Logo";

interface HeaderProps {
  onOpenDeck: () => void;
  onRestart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDeck, onRestart }) => {
  const {
    mode,
    setMode,
    theme,
    setTheme,
    toggleLightDark,
    soundEnabled,
    setSoundEnabled,
    soundProfile,
    setSoundProfile,
    fontSize,
    setFontSize,
    testType,
    setTestType,
    handMode,
    setHandMode,
    targetWordCount,
    setTargetWordCount,
    targetLetterCount,
    setTargetLetterCount,
    targetTimeSeconds,
    setTargetTimeSeconds,
    flashChunkSize,
    setFlashChunkSize,
    flashDurationMs,
    setFlashDurationMs,
    flashTotalRounds,
    setFlashTotalRounds,
    wordRecords,
    letterRecords,
  } = useTypingStore();

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [customModalType, setCustomModalType] =
    useState<CustomConfigType>(null);

  const getCurrentCustomValue = () => {
    switch (customModalType) {
      case "words":
        return targetWordCount;
      case "letters":
        return targetLetterCount;
      case "time":
        return targetTimeSeconds;
      case "chunk":
        return flashChunkSize;
      case "flash":
        return flashDurationMs;
      case "rounds":
        return flashTotalRounds;
      default:
        return 0;
    }
  };

  const handleSaveCustom = (
    type: NonNullable<CustomConfigType>,
    value: number,
  ) => {
    switch (type) {
      case "words":
        setTargetWordCount(value);
        break;
      case "letters":
        setTargetLetterCount(value);
        break;
      case "time":
        setTargetTimeSeconds(value);
        break;
      case "chunk":
        setFlashChunkSize(value);
        break;
      case "flash":
        setFlashDurationMs(value);
        break;
      case "rounds":
        setFlashTotalRounds(value);
        break;
    }
    onRestart();
  };

  // Is current theme dark?
  const isDark = theme.includes("dark") || theme === "catppuccin-mocha";

  // Count weak words (weight >= 1.5)
  const weakWordCount = Object.values(wordRecords).filter(
    (w) => w.weight >= 1.5,
  ).length;

  // Count weak letters (weight >= 1.5)
  const weakLetterCount = Object.values(letterRecords).filter(
    (l) => l.weight >= 1.5,
  ).length;

  const themes: {
    id: AppTheme;
    name: string;
    group: "Light Themes" | "Dark Themes";
    dot: string;
  }[] = [
    {
      id: "paper-light",
      name: "Paper White",
      group: "Light Themes",
      dot: "#10b981",
    },
    {
      id: "everforest-light",
      name: "Everforest Light",
      group: "Light Themes",
      dot: "#8da101",
    },
    {
      id: "catppuccin-latte",
      name: "Catppuccin Latte",
      group: "Light Themes",
      dot: "#40a02b",
    },
    {
      id: "everforest-dark",
      name: "Everforest Dark",
      group: "Dark Themes",
      dot: "#a7c080",
    },
    {
      id: "catppuccin-mocha",
      name: "Catppuccin Mocha",
      group: "Dark Themes",
      dot: "#a6e3a1",
    },
    {
      id: "gruvbox-dark",
      name: "Gruvbox Dark",
      group: "Dark Themes",
      dot: "#fabd2f",
    },
  ];

  return (
    <header className="w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col gap-4 pt-6 pb-4 px-4 select-none">
      {/* Top Navbar */}
      <div className="flex items-center justify-between">
        {/* Brand Logo & Author */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onRestart}
            title="SoloType — Click to restart test"
            className="flex items-center text-left transition-transform hover:opacity-95 active:scale-98 cursor-pointer"
          >
            <SoloTypeLogo size={30} />
          </button>
          <span
            className="hidden sm:inline-block text-xs px-2 py-0.5 rounded border"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-dim)",
              backgroundColor: "var(--bg-sub)",
            }}
          >
            v1.1 • spaced & light
          </span>

          {/* GitHub: hnamhocit */}
          <a
            href="https://github.com/hnamhocit"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub: @hnamhocit"
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:scale-105 active:scale-95 shadow-2xs"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-dim)",
              backgroundColor: "var(--bg-sub)",
            }}
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span className="font-semibold tracking-tight">hnamhocit</span>
          </a>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleLightDark}
            title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all border shadow-xs hover:border-[var(--color-primary)]"
            style={{
              backgroundColor: "var(--bg-sub)",
              borderColor: "var(--border-color)",
              color: isDark ? "#fbbf24" : "#6366f1",
            }}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium hidden sm:inline text-[var(--text-main)]">
                  Light
                </span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium hidden sm:inline text-[var(--text-main)]">
                  Dark
                </span>
              </>
            )}
          </button>

          {/* Weak Words Debt Badge / Deck Modal trigger */}
          <button
            type="button"
            onClick={onOpenDeck}
            title={
              mode === "single-letter"
                ? `Weak Keys: ${weakLetterCount} keys currently have high error/latency weight`
                : weakWordCount >= 50
                  ? "Debt Cap 50/50 reached! Must resolve weak words before learning new ones."
                  : "View Spaced Repetition Vocabulary & Error Analytics"
            }
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded transition-all border hover:border-[var(--color-primary)]"
            style={{
              backgroundColor:
                mode === "single-letter"
                  ? weakLetterCount > 0
                    ? "rgba(245, 158, 11, 0.15)"
                    : "var(--bg-sub)"
                  : weakWordCount >= 50
                    ? "rgba(239, 68, 68, 0.15)"
                    : "var(--bg-sub)",
              borderColor:
                mode === "single-letter"
                  ? weakLetterCount > 0
                    ? "var(--color-warning)"
                    : "var(--border-color)"
                  : weakWordCount >= 50
                    ? "var(--color-error)"
                    : "var(--border-color)",
              color:
                mode === "single-letter"
                  ? weakLetterCount > 0
                    ? "var(--color-warning)"
                    : "var(--text-dim)"
                  : weakWordCount >= 50
                    ? "var(--color-error)"
                    : weakWordCount > 0
                      ? "var(--color-warning)"
                      : "var(--text-dim)",
            }}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {mode === "single-letter" ? "Keys:" : "Debt:"}
            </span>
            <span className="font-bold">
              {mode === "single-letter"
                ? `${weakLetterCount} weak`
                : `${weakWordCount}/50`}
            </span>
            {mode === "spaced-repetition" && weakWordCount >= 50 && (
              <span className="text-[10px] font-bold text-red-500 animate-pulse hidden md:inline">
                [LOCK]
              </span>
            )}
          </button>

          {/* Sound Profile & Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSoundMenu(!showSoundMenu)}
              title={`Switch Sound: ${soundProfile} (Click to change)`}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded transition-all border hover:border-[var(--color-primary)]"
              style={{
                backgroundColor: "var(--bg-sub)",
                borderColor: "var(--border-color)",
                color: soundEnabled
                  ? "var(--color-primary)"
                  : "var(--text-dim)",
              }}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="text-[11px] font-semibold hidden md:inline capitalize">
                {soundEnabled ? soundProfile : "mute"}
              </span>
            </button>

            {showSoundMenu && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-lg shadow-xl border py-1.5 z-50 text-xs"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div
                  className="px-3 py-1 font-semibold uppercase text-[10px]"
                  style={{ color: "var(--text-dim)" }}
                >
                  Mechanical Switch Sound
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[var(--bg-sub)] transition-colors border-b"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-main)",
                  }}
                >
                  <span>Mute Sound</span>
                  <span>{soundEnabled ? "ON" : "OFF"}</span>
                </button>

                {(["thock", "clicky", "bubble"] as SoundProfile[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSoundProfile(p);
                      setSoundEnabled(true);
                      setShowSoundMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[var(--bg-sub)] transition-colors capitalize"
                    style={{
                      color:
                        soundProfile === p && soundEnabled
                          ? "var(--color-primary)"
                          : "var(--text-main)",
                    }}
                  >
                    <span>
                      {p === "thock"
                        ? "Creamy Thock"
                        : p === "clicky"
                          ? "Box Clicky"
                          : "Bubble Pop"}
                    </span>
                    {soundProfile === p && soundEnabled && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size Selector */}
          <div
            className="hidden sm:flex items-center gap-0.5 px-1 py-0.5 rounded border text-[11px]"
            style={{
              backgroundColor: "var(--bg-sub)",
              borderColor: "var(--border-color)",
            }}
            title="Adjust text font size"
          >
            <Type className="w-3 h-3 mx-1 text-[var(--text-dim)]" />
            {(["sm", "md", "lg"] as FontSize[]).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setFontSize(size)}
                className="px-1.5 py-0.5 rounded uppercase font-semibold transition-colors"
                style={{
                  color:
                    fontSize === size
                      ? "var(--color-primary)"
                      : "var(--text-dim)",
                  backgroundColor:
                    fontSize === size ? "var(--bg-card)" : "transparent",
                }}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Theme Palette Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              title="Change theme color palette"
              className="flex items-center gap-1 p-1.5 rounded transition-all border hover:border-[var(--color-primary)]"
              style={{
                backgroundColor: "var(--bg-sub)",
                borderColor: "var(--border-color)",
                color: "var(--text-dim)",
              }}
            >
              <Palette className="w-4 h-4" />
            </button>

            {showThemeMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl border py-2 z-50 text-xs"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-color)",
                }}
              >
                {/* Light Themes */}
                <div className="px-3 py-1 font-bold uppercase text-[10px] tracking-wider text-[var(--color-primary)]">
                  Light Themes
                </div>
                {themes
                  .filter((t) => t.group === "Light Themes")
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id);
                        setShowThemeMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[var(--bg-sub)] transition-colors"
                      style={{
                        color:
                          theme === t.id
                            ? "var(--color-primary)"
                            : "var(--text-main)",
                        fontWeight: theme === t.id ? "bold" : "normal",
                      }}
                    >
                      <span>{t.name}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/10"
                        style={{ backgroundColor: t.dot }}
                      />
                    </button>
                  ))}

                {/* Dark Themes */}
                <div
                  className="px-3 pt-2.5 pb-1 font-bold uppercase text-[10px] tracking-wider text-[var(--color-warning)] border-t mt-1"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  Dark Themes
                </div>
                {themes
                  .filter((t) => t.group === "Dark Themes")
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id);
                        setShowThemeMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[var(--bg-sub)] transition-colors"
                      style={{
                        color:
                          theme === t.id
                            ? "var(--color-primary)"
                            : "var(--text-main)",
                        fontWeight: theme === t.id ? "bold" : "normal",
                      }}
                    >
                      <span>{t.name}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.dot }}
                      />
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mode Switcher & Configuration Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-lg border text-xs shadow-xs"
        style={{
          backgroundColor: "var(--bg-sub)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Core Modes */}
        <div className="flex items-center gap-1 p-0.5 rounded bg-[var(--bg-card)]">
          <button
            type="button"
            onClick={() => {
              setMode("spaced-repetition");
              onRestart();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-medium"
            style={{
              backgroundColor:
                mode === "spaced-repetition" ? "var(--bg-sub)" : "transparent",
              color:
                mode === "spaced-repetition"
                  ? "var(--color-primary)"
                  : "var(--text-dim)",
              boxShadow:
                mode === "spaced-repetition"
                  ? "0 1px 3px rgba(0,0,0,0.08)"
                  : "none",
            }}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Spaced Words</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("single-letter");
              onRestart();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-medium"
            style={{
              backgroundColor:
                mode === "single-letter" ? "var(--bg-sub)" : "transparent",
              color:
                mode === "single-letter"
                  ? "var(--color-primary)"
                  : "var(--text-dim)",
              boxShadow:
                mode === "single-letter"
                  ? "0 1px 3px rgba(0,0,0,0.08)"
                  : "none",
            }}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Single Letter</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("flash-type");
              onRestart();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-medium"
            style={{
              backgroundColor:
                mode === "flash-type" ? "var(--bg-sub)" : "transparent",
              color:
                mode === "flash-type"
                  ? "var(--color-primary)"
                  : "var(--text-dim)",
              boxShadow:
                mode === "flash-type" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Flash & Type</span>
          </button>
        </div>

        {/* Dynamic Mode Sub-settings */}
        <div className="flex items-center gap-3">
          {mode === "spaced-repetition" || mode === "single-letter" ? (
            <div className="flex flex-wrap items-center gap-3">
              {/* Hand Mode Switcher: both / left / right */}
              <div className="flex items-center rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-0.5 text-[11px]">
                <span className="text-[10px] px-1 text-[var(--text-dim)] font-medium">
                  hand:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setHandMode("both");
                    onRestart();
                  }}
                  className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                    handMode === "both"
                      ? "bg-[var(--bg-sub)] text-[var(--color-primary)]"
                      : "text-[var(--text-dim)]"
                  }`}
                  title="Practice with both hands"
                >
                  both
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHandMode("left");
                    onRestart();
                  }}
                  className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                    handMode === "left"
                      ? "bg-[var(--bg-sub)] text-[var(--color-primary)]"
                      : "text-[var(--text-dim)]"
                  }`}
                  title={
                    mode === "single-letter"
                      ? "Left hand keys (q, w, e, r, t, a, s, d, f, g, z, x, c, v, b)"
                      : "Left hand only (q, w, e, r, t, a, s, d, f, g, z, x, c, v, b)"
                  }
                >
                  left
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHandMode("right");
                    onRestart();
                  }}
                  className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                    handMode === "right"
                      ? "bg-[var(--bg-sub)] text-[var(--color-primary)]"
                      : "text-[var(--text-dim)]"
                  }`}
                  title={
                    mode === "single-letter"
                      ? "Right hand keys (y, u, i, o, p, h, j, k, l, n, m)"
                      : "Right hand only (y, u, i, o, p, h, j, k, l, n, m)"
                  }
                >
                  right
                </button>
              </div>

              {/* Type Switcher: words/letters vs time */}
              <div className="flex items-center rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setTestType("words");
                    onRestart();
                  }}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    testType === "words"
                      ? "bg-[var(--bg-sub)] text-[var(--color-primary)]"
                      : "text-[var(--text-dim)]"
                  }`}
                >
                  {mode === "single-letter" ? "letters" : "words"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTestType("time");
                    onRestart();
                  }}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    testType === "time"
                      ? "bg-[var(--bg-sub)] text-[var(--color-primary)]"
                      : "text-[var(--text-dim)]"
                  }`}
                >
                  time
                </button>
              </div>

              {testType === "words" ? (
                mode === "single-letter" ? (
                  <div className="flex items-center gap-1">
                    {[25, 50, 100, 200].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setTargetLetterCount(count);
                          onRestart();
                        }}
                        className="px-2 py-0.5 rounded transition-colors font-semibold"
                        style={{
                          color:
                            targetLetterCount === count
                              ? "var(--color-primary)"
                              : "var(--text-dim)",
                          backgroundColor:
                            targetLetterCount === count
                              ? "var(--bg-card)"
                              : "transparent",
                        }}
                      >
                        {count}
                      </button>
                    ))}

                    {/* If custom letter count is chosen and not in standard presets */}
                    {![25, 50, 100, 200].includes(targetLetterCount) && (
                      <button
                        type="button"
                        onClick={() => setCustomModalType("letters")}
                        className="px-2 py-0.5 rounded transition-colors font-bold text-[var(--color-primary)] bg-[var(--bg-card)] border border-[var(--color-primary)]/40"
                      >
                        {targetLetterCount}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setCustomModalType("letters")}
                      title="Set custom letter count (e.g. 75, 150)"
                      className="px-1.5 py-0.5 rounded transition-colors text-[11px] text-[var(--text-dim)] hover:text-[var(--color-primary)]"
                    >
                      custom
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {[15, 25, 50, 100].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setTargetWordCount(count);
                          onRestart();
                        }}
                        className="px-2 py-0.5 rounded transition-colors font-semibold"
                        style={{
                          color:
                            targetWordCount === count
                              ? "var(--color-primary)"
                              : "var(--text-dim)",
                          backgroundColor:
                            targetWordCount === count
                              ? "var(--bg-card)"
                              : "transparent",
                        }}
                      >
                        {count}
                      </button>
                    ))}

                    {/* If custom word count is chosen and not in standard presets */}
                    {![15, 25, 50, 100].includes(targetWordCount) && (
                      <button
                        type="button"
                        onClick={() => setCustomModalType("words")}
                        className="px-2 py-0.5 rounded transition-colors font-bold text-[var(--color-primary)] bg-[var(--bg-card)] border border-[var(--color-primary)]/40"
                      >
                        {targetWordCount}
                      </button>
                    )}

                    {/* Custom Word Count trigger */}
                    <button
                      type="button"
                      onClick={() => setCustomModalType("words")}
                      title="Set custom word count (e.g. 120, 130)"
                      className="px-1.5 py-0.5 rounded transition-colors text-[11px] text-[var(--text-dim)] hover:text-[var(--color-primary)]"
                    >
                      custom
                    </button>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-1">
                  {[15, 30, 60, 120].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setTargetTimeSeconds(sec);
                        onRestart();
                      }}
                      className="px-2 py-0.5 rounded transition-colors font-semibold"
                      style={{
                        color:
                          targetTimeSeconds === sec
                            ? "var(--color-primary)"
                            : "var(--text-dim)",
                        backgroundColor:
                          targetTimeSeconds === sec
                            ? "var(--bg-card)"
                            : "transparent",
                      }}
                    >
                      {sec}s
                    </button>
                  ))}

                  {/* If custom time is chosen and not in standard presets */}
                  {![15, 30, 60, 120].includes(targetTimeSeconds) && (
                    <button
                      type="button"
                      onClick={() => setCustomModalType("time")}
                      className="px-2 py-0.5 rounded transition-colors font-bold text-[var(--color-primary)] bg-[var(--bg-card)] border border-[var(--color-primary)]/40"
                    >
                      {targetTimeSeconds}s
                    </button>
                  )}

                  {/* Custom Time trigger */}
                  <button
                    type="button"
                    onClick={() => setCustomModalType("time")}
                    title="Set custom duration in seconds"
                    className="px-1.5 py-0.5 rounded transition-colors text-[11px] text-[var(--text-dim)] hover:text-[var(--color-primary)]"
                  >
                    custom
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Chunk Size */}
              <div className="flex items-center gap-1">
                <span
                  className="text-[11px] mr-0.5"
                  style={{ color: "var(--text-dim)" }}
                >
                  chunk:
                </span>
                {[2, 3, 4, 5, 6].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setFlashChunkSize(size);
                      onRestart();
                    }}
                    className="px-1.5 py-0.5 rounded transition-colors font-semibold"
                    style={{
                      color:
                        flashChunkSize === size
                          ? "var(--color-primary)"
                          : "var(--text-dim)",
                      backgroundColor:
                        flashChunkSize === size
                          ? "var(--bg-card)"
                          : "transparent",
                    }}
                  >
                    {size}
                  </button>
                ))}

                {![2, 3, 4, 5, 6].includes(flashChunkSize) && (
                  <button
                    type="button"
                    onClick={() => setCustomModalType("chunk")}
                    className="px-1.5 py-0.5 rounded font-bold text-[var(--color-primary)] bg-[var(--bg-card)] border border-[var(--color-primary)]/40"
                  >
                    {flashChunkSize}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCustomModalType("chunk")}
                  title="Custom chunk size"
                  className="px-1 py-0.5 rounded text-[10px] text-[var(--text-dim)] hover:text-[var(--color-primary)]"
                >
                  custom
                </button>
              </div>

              {/* Flash Duration */}
              <div className="flex items-center gap-1">
                <span
                  className="text-[11px] mr-0.5"
                  style={{ color: "var(--text-dim)" }}
                >
                  flash:
                </span>
                {[
                  { ms: 1000, label: "1.0s" },
                  { ms: 1500, label: "1.5s" },
                  { ms: 2000, label: "2.0s" },
                  { ms: 3000, label: "3.0s" },
                ].map((item) => (
                  <button
                    key={item.ms}
                    type="button"
                    onClick={() => {
                      setFlashDurationMs(item.ms);
                      onRestart();
                    }}
                    className="px-1.5 py-0.5 rounded transition-colors font-semibold"
                    style={{
                      color:
                        flashDurationMs === item.ms
                          ? "var(--color-primary)"
                          : "var(--text-dim)",
                      backgroundColor:
                        flashDurationMs === item.ms
                          ? "var(--bg-card)"
                          : "transparent",
                    }}
                  >
                    {item.label}
                  </button>
                ))}

                {![1000, 1500, 2000, 3000].includes(flashDurationMs) && (
                  <button
                    type="button"
                    onClick={() => setCustomModalType("flash")}
                    className="px-1.5 py-0.5 rounded font-bold text-[var(--color-primary)] bg-[var(--bg-card)] border border-[var(--color-primary)]/40"
                  >
                    {(flashDurationMs / 1000).toFixed(1)}s
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCustomModalType("flash")}
                  title="Custom flash display duration"
                  className="px-1 py-0.5 rounded text-[10px] text-[var(--text-dim)] hover:text-[var(--color-primary)]"
                >
                  custom
                </button>
              </div>

              {/* Rounds */}
              <div className="flex items-center gap-1">
                <span
                  className="text-[11px] mr-0.5"
                  style={{ color: "var(--text-dim)" }}
                >
                  rounds:
                </span>
                {[3, 5, 10].map((rounds) => (
                  <button
                    key={rounds}
                    type="button"
                    onClick={() => {
                      setFlashTotalRounds(rounds);
                      onRestart();
                    }}
                    className="px-1.5 py-0.5 rounded transition-colors font-semibold"
                    style={{
                      color:
                        flashTotalRounds === rounds
                          ? "var(--color-primary)"
                          : "var(--text-dim)",
                      backgroundColor:
                        flashTotalRounds === rounds
                          ? "var(--bg-card)"
                          : "transparent",
                    }}
                  >
                    {rounds}
                  </button>
                ))}

                {![3, 5, 10].includes(flashTotalRounds) && (
                  <button
                    type="button"
                    onClick={() => setCustomModalType("rounds")}
                    className="px-1.5 py-0.5 rounded font-bold text-[var(--color-primary)] bg-[var(--bg-card)] border border-[var(--color-primary)]/40"
                  >
                    {flashTotalRounds}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCustomModalType("rounds")}
                  title="Custom total rounds"
                  className="px-1 py-0.5 rounded text-[10px] text-[var(--text-dim)] hover:text-[var(--color-primary)]"
                >
                  custom
                </button>
              </div>
            </div>
          )}

          {/* Quick Restart Icon Button */}
          <button
            type="button"
            onClick={onRestart}
            title="Restart session (Tab)"
            className="p-1.5 rounded transition-colors hover:text-[var(--color-primary)]"
            style={{ color: "var(--text-dim)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Custom Configuration Modal */}
      <CustomConfigModal
        isOpen={customModalType !== null}
        type={customModalType}
        currentValue={getCurrentCustomValue()}
        onClose={() => setCustomModalType(null)}
        onSave={handleSaveCustom}
      />
    </header>
  );
};
