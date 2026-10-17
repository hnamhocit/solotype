"use client";

import confetti from "canvas-confetti";
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Database,
  Flame,
  RotateCcw,
  Search,
  Type,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { ALL_LETTERS } from "@/lib/constants";
import type { TestResult } from "@/lib/types";
import { useTypingStore } from "@/store/useTypingStore";

interface StatsScreenProps {
  result?: TestResult | null;
  onRestart: () => void;
  onPracticeWeakOnly: () => void;
  isDeckModal?: boolean;
  onCloseDeckModal?: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  result,
  onRestart,
  onPracticeWeakOnly,
  isDeckModal = false,
  onCloseDeckModal,
}) => {
  const {
    wordRecords,
    letterRecords,
    globalAverageLatencyMs,
    resetWordRecords,
    resetLetterRecords,
    mode,
    setMode,
  } = useTypingStore();

  const [activeTab, setActiveTab] = useState<"result" | "deck" | "letters">(
    isDeckModal ? (mode === "single-letter" ? "letters" : "deck") : "result",
  );
  const [deckFilter, setDeckFilter] = useState<"all" | "weak" | "mastered">(
    "weak",
  );
  const [letterFilter, setLetterFilter] = useState<"all" | "weak" | "mastered">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Trigger celebration confetti on high accuracy or high WPM
  useEffect(() => {
    if (result && !isDeckModal) {
      if (result.wpm >= 70 || result.accuracy >= 98) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#a7c080", "#dbbc7f", "#7fbbb3", "#d699b6"],
        });
      }
    }
  }, [result, isDeckModal]);

  // Aggregate word records stats
  const allRecordedWords = useMemo(
    () => Object.values(wordRecords),
    [wordRecords],
  );

  const weakWords = useMemo(
    () => allRecordedWords.filter((w) => w.weight >= 1.5),
    [allRecordedWords],
  );

  const masteredWords = useMemo(
    () =>
      allRecordedWords.filter((w) => w.weight <= 0.6 && w.totalAttempts >= 3),
    [allRecordedWords],
  );

  // Filtered deck words
  const filteredDeckWords = useMemo(() => {
    return allRecordedWords
      .filter((w) => {
        if (deckFilter === "weak") return w.weight >= 1.5;
        if (deckFilter === "mastered") return w.weight <= 0.6;
        return true;
      })
      .filter((w) =>
        w.word.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
      .sort((a, b) => b.weight - a.weight);
  }, [allRecordedWords, deckFilter, searchQuery]);

  // Aggregate letter records stats
  const allLettersList = useMemo(() => {
    return ALL_LETTERS.map((letter) => {
      const rec = letterRecords[letter.toLowerCase()];
      return {
        letter,
        totalAttempts: rec?.totalAttempts ?? 0,
        successAttempts: rec?.successAttempts ?? 0,
        averageLatencyMs: rec?.averageLatencyMs ?? 0,
        lastLatencyMs: rec?.lastLatencyMs ?? 0,
        weight: rec?.weight ?? 1.0,
        errorCount: rec?.errorCount ?? 0,
        consecutiveFastStreak: rec?.consecutiveFastStreak ?? 0,
      };
    });
  }, [letterRecords]);

  const practicedLettersCount = useMemo(
    () => allLettersList.filter((l) => l.totalAttempts > 0).length,
    [allLettersList],
  );

  const weakLettersList = useMemo(
    () => allLettersList.filter((l) => l.weight >= 1.5),
    [allLettersList],
  );

  const masteredLettersList = useMemo(
    () => allLettersList.filter((l) => l.weight <= 0.6 && l.totalAttempts >= 5),
    [allLettersList],
  );

  const filteredLetters = useMemo(() => {
    return allLettersList.filter((l) => {
      if (letterFilter === "weak") return l.weight >= 1.5;
      if (letterFilter === "mastered")
        return l.weight <= 0.6 && l.totalAttempts >= 5;
      return true;
    });
  }, [allLettersList, letterFilter]);

  // Handle hotkeys (Tab or Enter to restart)
  useEffect(() => {
    if (isDeckModal) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        onRestart();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onRestart, isDeckModal]);

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col gap-6 py-4 px-2 font-mono select-none animate-fadeIn">
      {/* Header Tabs if viewing modal or has result */}
      <div
        className="flex items-center justify-between border-b pb-3"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="flex items-center gap-2">
          {result && (
            <button
              type="button"
              onClick={() => setActiveTab("result")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "result"
                  ? "bg-[var(--bg-card)] text-[var(--color-primary)] border border-[var(--border-color)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
              }`}
            >
              Test Analytics
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("deck")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "deck"
                ? "bg-[var(--bg-card)] text-[var(--color-primary)] border border-[var(--border-color)]"
                : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Spaced Words Deck</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--bg-sub)] border border-[var(--border-color)]">
              {allRecordedWords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("letters")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "letters"
                ? "bg-[var(--bg-card)] text-[var(--color-primary)] border border-[var(--border-color)]"
                : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Letter Mastery (A-Z)</span>
            {weakLettersList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/10 text-[var(--color-warning)] border border-amber-500/20 font-bold">
                {weakLettersList.length} weak
              </span>
            )}
          </button>
        </div>

        {isDeckModal && onCloseDeckModal && (
          <button
            type="button"
            onClick={onCloseDeckModal}
            className="p-1 rounded-md hover:bg-[var(--bg-card)] transition-colors text-[var(--text-dim)] hover:text-[var(--text-main)]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* TAB 1: TEST ANALYTICS RESULT */}
      {activeTab === "result" && result && (
        <div className="flex flex-col gap-8">
          {/* Hero Performance Card */}
          <div
            className="p-6 rounded-2xl border shadow-xl flex flex-wrap items-center justify-around gap-6"
            style={{
              backgroundColor: "var(--bg-sub)",
              borderColor: "var(--border-color)",
            }}
          >
            {/* WPM */}
            <div className="text-center">
              <div
                className="text-5xl sm:text-6xl font-bold tracking-tight"
                style={{ color: "var(--color-primary)" }}
              >
                {result.wpm}
              </div>
              <div
                className="text-xs uppercase tracking-wider mt-1"
                style={{ color: "var(--text-dim)" }}
              >
                Net WPM
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
                {result.mode === "single-letter"
                  ? `${result.wpm * 5} cpm`
                  : `raw: ${result.rawWpm}`}
              </div>
            </div>

            {/* Accuracy */}
            <div className="text-center">
              <div
                className="text-5xl sm:text-6xl font-bold tracking-tight"
                style={{
                  color:
                    result.accuracy >= 95
                      ? "var(--color-primary)"
                      : result.accuracy >= 85
                        ? "var(--color-warning)"
                        : "var(--color-error)",
                }}
              >
                {result.accuracy}%
              </div>
              <div
                className="text-xs uppercase tracking-wider mt-1"
                style={{ color: "var(--text-dim)" }}
              >
                Accuracy
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
                errors: {result.errorCount}
              </div>
            </div>

            {/* Duration */}
            <div className="text-center">
              <div
                className="text-5xl sm:text-6xl font-bold tracking-tight"
                style={{ color: "var(--color-info)" }}
              >
                {(result.durationMs / 1000).toFixed(1)}s
              </div>
              <div
                className="text-xs uppercase tracking-wider mt-1"
                style={{ color: "var(--text-dim)" }}
              >
                Time
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
                {result.mode === "single-letter" ? "letters" : "words"}:{" "}
                {result.wordCount}
              </div>
            </div>
          </div>

          {/* Word-by-Word Latency & Spaced Repetition Breakdown */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                <span className="font-semibold text-[var(--text-main)]">
                  {result.mode === "single-letter"
                    ? "Letter Breakdown & Latency Analysis"
                    : "Word Breakdown & Latency Analysis"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[var(--text-dim)]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                  Fast (&le;{globalAverageLatencyMs}ms)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
                  Slow (&gt;{globalAverageLatencyMs}ms)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-error)]" />
                  Mistyped
                </span>
              </div>
            </div>

            {/* List of Words with Latency Chips */}
            <div
              className="p-4 rounded-xl border flex flex-wrap gap-2 text-xs"
              style={{
                backgroundColor: "var(--bg-sub)",
                borderColor: "var(--border-color)",
              }}
            >
              {result.wordBreakdown.map((item, idx) => {
                const isSlow =
                  globalAverageLatencyMs > 0 &&
                  item.latencyMs > globalAverageLatencyMs;
                const statusColor = item.hasError
                  ? "var(--color-error)"
                  : isSlow
                    ? "var(--color-warning)"
                    : "var(--color-primary)";

                const weightDiff = Number(
                  (item.newWeight - item.previousWeight).toFixed(1),
                );

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all hover:scale-105"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <span
                      className="font-semibold"
                      style={{ color: statusColor }}
                    >
                      {item.word}
                    </span>
                    <span className="text-[10px] text-[var(--text-dim)]">
                      {item.latencyMs}ms
                    </span>

                    {/* Weight change badge */}
                    {item.hasError ? (
                      <span
                        title="Mistyped: weight increased"
                        className="text-[10px] text-[var(--color-error)] font-bold"
                      >
                        +{weightDiff > 0 ? weightDiff : "1.5"}
                      </span>
                    ) : isSlow ? (
                      <span
                        title="Slow latency: weight increased"
                        className="text-[10px] text-[var(--color-warning)] font-bold"
                      >
                        +{weightDiff > 0 ? weightDiff : "0.6"}
                      </span>
                    ) : weightDiff < 0 ? (
                      <span
                        title="Fast clean streak: weight decayed (mastering)"
                        className="text-[10px] text-[var(--color-primary)] font-bold"
                      >
                        {weightDiff}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onRestart}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-transform hover:scale-105 active:scale-95 shadow-md"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--bg-main)",
                }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Next Test</span>
                <kbd className="px-1.5 py-0.5 rounded text-[11px] bg-black/20 font-mono">
                  Tab
                </kbd>
              </button>

              {weakWords.length > 0 && (
                <button
                  type="button"
                  onClick={onPracticeWeakOnly}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border font-medium transition-all hover:border-[var(--color-warning)] text-[var(--color-warning)] bg-[var(--bg-sub)]"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <Flame className="w-4 h-4" />
                  <span>Practice Weak Words ({weakWords.length})</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("deck")}
              className="flex items-center gap-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Inspect Vocabulary Deck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SPACED VOCABULARY DECK */}
      {activeTab === "deck" && (
        <div className="flex flex-col gap-6">
          {/* Deck Summary Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className="p-3.5 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-sub)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="text-xl font-bold text-[var(--text-main)]">
                {allRecordedWords.length}
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
                Words Practiced
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border"
              style={{
                backgroundColor:
                  weakWords.length >= 50
                    ? "rgba(239, 68, 68, 0.12)"
                    : "var(--bg-sub)",
                borderColor:
                  weakWords.length >= 50
                    ? "var(--color-error)"
                    : "var(--border-color)",
              }}
            >
              <div
                className={`text-xl font-bold flex items-center justify-between ${
                  weakWords.length >= 50
                    ? "text-[var(--color-error)]"
                    : "text-[var(--color-warning)]"
                }`}
              >
                <span>{weakWords.length} / 50</span>
                {weakWords.length >= 50 && (
                  <span className="text-[10px] uppercase font-bold text-red-500 animate-pulse">
                    LOCKED
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
                Active Debt (Cap 50)
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-sub)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="text-xl font-bold text-[var(--color-primary)]">
                {masteredWords.length}
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
                Mastered
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-sub)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="text-xl font-bold text-[var(--color-info)]">
                {globalAverageLatencyMs}ms
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
                Global Avg Latency
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-0.5 rounded bg-[var(--bg-sub)] text-xs">
              <button
                type="button"
                onClick={() => setDeckFilter("weak")}
                className={`px-3 py-1 rounded transition-colors ${
                  deckFilter === "weak"
                    ? "bg-[var(--bg-card)] text-[var(--color-warning)] font-semibold"
                    : "text-[var(--text-dim)]"
                }`}
              >
                Needs Review ({weakWords.length})
              </button>

              <button
                type="button"
                onClick={() => setDeckFilter("mastered")}
                className={`px-3 py-1 rounded transition-colors ${
                  deckFilter === "mastered"
                    ? "bg-[var(--bg-card)] text-[var(--color-primary)] font-semibold"
                    : "text-[var(--text-dim)]"
                }`}
              >
                Mastered ({masteredWords.length})
              </button>

              <button
                type="button"
                onClick={() => setDeckFilter("all")}
                className={`px-3 py-1 rounded transition-colors ${
                  deckFilter === "all"
                    ? "bg-[var(--bg-card)] text-[var(--text-main)] font-semibold"
                    : "text-[var(--text-dim)]"
                }`}
              >
                All Practiced ({allRecordedWords.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-[var(--text-dim)]" />
              <input
                type="text"
                placeholder="Search word..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-lg border text-xs outline-none focus:border-[var(--color-primary)]"
                style={{
                  backgroundColor: "var(--bg-sub)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-main)",
                }}
              />
            </div>
          </div>

          {/* Word List Table / Cards */}
          <div
            className="w-full max-h-[340px] overflow-y-auto rounded-xl border p-2 flex flex-col gap-1.5"
            style={{
              backgroundColor: "var(--bg-sub)",
              borderColor: "var(--border-color)",
            }}
          >
            {filteredDeckWords.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-dim)] flex flex-col items-center gap-2">
                <CheckCircle className="w-6 h-6 text-[var(--color-primary)] opacity-60" />
                <span>
                  {deckFilter === "weak"
                    ? "No weak words detected! Great typing accuracy & speed."
                    : "No words found matching current filter."}
                </span>
              </div>
            ) : (
              filteredDeckWords.map((rec) => {
                const isWeak = rec.weight >= 1.5;
                const isMastered = rec.weight <= 0.6;

                return (
                  <div
                    key={rec.word}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors hover:bg-[var(--bg-card)]"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    {/* Word + Tag */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className="font-bold text-sm"
                        style={{
                          color: isWeak
                            ? "var(--color-warning)"
                            : isMastered
                              ? "var(--color-primary)"
                              : "var(--text-main)",
                        }}
                      >
                        {rec.word}
                      </span>
                      {isWeak && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20">
                          weight {rec.weight.toFixed(1)}
                        </span>
                      )}
                      {isMastered && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                          mastered
                        </span>
                      )}
                    </div>

                    {/* Stats metrics */}
                    <div className="flex items-center gap-4 text-[11px] text-[var(--text-dim)]">
                      <span>
                        attempts:{" "}
                        <strong className="text-[var(--text-main)]">
                          {rec.totalAttempts}
                        </strong>
                      </span>
                      <span>
                        errors:{" "}
                        <strong
                          className={
                            rec.errorCount > 0
                              ? "text-[var(--color-error)]"
                              : "text-[var(--text-main)]"
                          }
                        >
                          {rec.errorCount}
                        </strong>
                      </span>
                      <span>
                        avg latency:{" "}
                        <strong className="text-[var(--text-main)]">
                          {rec.averageLatencyMs}ms
                        </strong>
                      </span>
                      <span>
                        streak:{" "}
                        <strong className="text-[var(--color-primary)]">
                          {rec.consecutiveFastStreak}
                        </strong>
                        /3
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Deck Action buttons */}
          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    "Reset all spaced repetition weights and learned words? This cannot be undone.",
                  )
                ) {
                  resetWordRecords();
                }
              }}
              className="text-[var(--color-error)] hover:underline opacity-80"
            >
              Reset Learning Weights
            </button>

            {weakWords.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (onCloseDeckModal) onCloseDeckModal();
                  onPracticeWeakOnly();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs shadow transition-transform hover:scale-105"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--bg-main)",
                }}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Practice Weak Words Now ({weakWords.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LETTER MASTERY (A-Z) */}
      {activeTab === "letters" && (
        <div className="flex flex-col gap-6">
          {/* Letter Summary Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className="p-3.5 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-sub)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="text-xl font-bold text-[var(--text-main)]">
                {practicedLettersCount} / 26
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
                Keys Practiced
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border"
              style={{
                backgroundColor:
                  weakLettersList.length > 0
                    ? "rgba(245, 158, 11, 0.12)"
                    : "var(--bg-sub)",
                borderColor:
                  weakLettersList.length > 0
                    ? "var(--color-warning)"
                    : "var(--border-color)",
              }}
            >
              <div className="text-xl font-bold text-[var(--color-warning)]">
                {weakLettersList.length}
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
                Weak Keys (Weight &ge; 1.5)
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-sub)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="text-xl font-bold text-[var(--color-primary)]">
                {masteredLettersList.length}
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
                Mastered Keys
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-sub)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="text-xl font-bold text-[var(--color-info)]">
                {Math.round(
                  allLettersList.reduce(
                    (acc, l) => acc + l.averageLatencyMs,
                    0,
                  ) / Math.max(1, practicedLettersCount) || 0,
                )}
                ms
              </div>
              <div className="text-[11px] text-[var(--text-dim)] mt-0.5">
                Avg Latency (Keys)
              </div>
            </div>
          </div>

          {/* Letter Filter Controls */}
          <div className="flex items-center gap-2 text-xs">
            {(["all", "weak", "mastered"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setLetterFilter(filter)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  letterFilter === filter
                    ? "bg-[var(--bg-card)] text-[var(--color-primary)] border border-[var(--border-color)] shadow-xs"
                    : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
                }`}
              >
                {filter === "all"
                  ? "All Keys (26)"
                  : filter === "weak"
                    ? `Weak (${weakLettersList.length})`
                    : `Mastered (${masteredLettersList.length})`}
              </button>
            ))}
          </div>

          {/* Grid of 26 letters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredLetters.map((item) => {
              const isWeak = item.weight >= 1.5;
              const isMastered = item.weight <= 0.6 && item.totalAttempts >= 5;
              const accuracy =
                item.totalAttempts > 0
                  ? Math.round(
                      (item.successAttempts / item.totalAttempts) * 100,
                    )
                  : 100;

              return (
                <div
                  key={item.letter}
                  className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                    isWeak
                      ? "border-[var(--color-warning)]/60 bg-[var(--color-warning)]/5 shadow-xs"
                      : isMastered
                        ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5"
                        : "border-[var(--border-color)] bg-[var(--bg-sub)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-2xl font-bold uppercase"
                      style={{
                        color: isWeak
                          ? "var(--color-warning)"
                          : isMastered
                            ? "var(--color-primary)"
                            : "var(--text-main)",
                      }}
                    >
                      {item.letter}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isWeak
                          ? "bg-[var(--color-warning)]/20 text-[var(--color-warning)]"
                          : isMastered
                            ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                            : "bg-[var(--bg-card)] text-[var(--text-dim)]"
                      }`}
                    >
                      {item.weight.toFixed(1)}x
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] text-[var(--text-dim)]">
                    <div className="flex justify-between">
                      <span>attempts:</span>
                      <strong className="text-[var(--text-main)]">
                        {item.totalAttempts}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>errors:</span>
                      <strong
                        className={
                          item.errorCount > 0
                            ? "text-[var(--color-error)]"
                            : "text-[var(--text-main)]"
                        }
                      >
                        {item.errorCount}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>latency:</span>
                      <strong className="text-[var(--text-main)]">
                        {item.averageLatencyMs > 0
                          ? `${item.averageLatencyMs}ms`
                          : "—"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>acc:</span>
                      <strong
                        style={{
                          color:
                            item.totalAttempts === 0
                              ? "var(--text-dim)"
                              : accuracy >= 90
                                ? "var(--color-primary)"
                                : "var(--color-error)",
                        }}
                      >
                        {item.totalAttempts > 0 ? `${accuracy}%` : "—"}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Letter Action buttons */}
          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    "Reset all single letter weights and mastery stats? This cannot be undone.",
                  )
                ) {
                  resetLetterRecords();
                }
              }}
              className="text-[var(--color-error)] hover:underline opacity-80"
            >
              Reset Letter Weights
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("single-letter");
                if (onCloseDeckModal) onCloseDeckModal();
                onRestart();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs shadow transition-transform hover:scale-105"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--bg-main)",
              }}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Practice Single Letter Mode</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
