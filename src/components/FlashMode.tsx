"use client";

import confetti from "canvas-confetti";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type AlignedWordPair, calculateFlashScore } from "@/lib/scoring";
import { playKeyClick } from "@/lib/sound";
import type { TestResult } from "@/lib/types";
import { useTypingStore } from "@/store/useTypingStore";
import { FocusNotice } from "./FocusNotice";

type FlashPhase = "READY" | "MEMORIZING" | "TYPING" | "REVIEW" | "SUMMARY";

interface FlashRoundStat {
  targetWords: string[];
  typedWords: string[];
  wpm: number;
  rawWpm: number;
  accuracy: number;
  durationMs: number;
  perfect: boolean;
  alignment: AlignedWordPair[];
}

export const FlashMode: React.FC = () => {
  const {
    dictionary,
    flashChunkSize,
    flashDurationMs,
    flashTotalRounds,
    soundEnabled,
    soundProfile,
    getFlashChunk,
    recordTestResult,
  } = useTypingStore();

  const [phase, setPhase] = useState<FlashPhase>("READY");
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [typedWordsList, setTypedWordsList] = useState<string[]>([]);

  // Round & Session progression (configurable rounds per session)
  const TOTAL_ROUNDS = flashTotalRounds;
  const [roundNumber, setRoundNumber] = useState(1);
  const [sessionHistory, setSessionHistory] = useState<FlashRoundStat[]>([]);

  // Timestamps
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [countdownProgress, setCountdownProgress] = useState(100);
  const [isFocused, setIsFocused] = useState(true);

  // Review stats
  const [latestRoundStat, setLatestRoundStat] = useState<FlashRoundStat | null>(
    null,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const memorizingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Prepare a new flash chunk
  const initChunk = useCallback(() => {
    const chunk = getFlashChunk(flashChunkSize);
    setTargetWords(chunk);
    setCurrentWordIdx(0);
    setCurrentInput("");
    setTypedWordsList([]);
    setCountdownProgress(100);
    setTypingStartTime(null);
    setPhase("READY");
  }, [getFlashChunk, flashChunkSize]);

  // Restart entire session
  const restartSession = useCallback(() => {
    setRoundNumber(1);
    setSessionHistory([]);
    setLatestRoundStat(null);
    initChunk();
  }, [initChunk]);

  useEffect(() => {
    if (dictionary.length > 0) {
      restartSession();
    }
  }, [dictionary.length, restartSession]);

  // Start the memorization countdown
  const startMemorizing = useCallback(() => {
    setPhase("MEMORIZING");
    const startTime = performance.now();
    const duration = flashDurationMs;

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      setCountdownProgress(remainingPercent);

      if (elapsed < duration) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Flash expired! Switch to blind typing from memory
        setPhase("TYPING");
        setTypingStartTime(performance.now());
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [flashDurationMs]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (memorizingTimerRef.current) clearTimeout(memorizingTimerRef.current);
    };
  }, []);

  // Complete current flash chunk & review
  const completeChunk = useCallback(
    (finalTypedWords: string[]) => {
      const now = performance.now();
      const startTime = typingStartTime || now - 1000;
      const durationMs = Math.max(500, Math.round(now - startTime));

      // Calculate score using sequence alignment and Levenshtein distance
      const { accuracy, wpm, rawWpm, alignment, isFlawless } =
        calculateFlashScore(targetWords, finalTypedWords, durationMs);

      if (isFlawless) {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#10b981", "#f59e0b", "#0284c7"],
        });
      }

      const stat: FlashRoundStat = {
        targetWords,
        typedWords: finalTypedWords,
        wpm,
        rawWpm,
        accuracy,
        durationMs,
        perfect: isFlawless,
        alignment,
      };

      setLatestRoundStat(stat);
      const updatedHistory = [...sessionHistory, stat];
      setSessionHistory(updatedHistory);

      // Save to global history
      const result: TestResult = {
        id: `flash-${Date.now()}`,
        timestamp: Date.now(),
        mode: "flash-type",
        wpm,
        rawWpm,
        accuracy,
        durationMs,
        wordCount: targetWords.length,
        errorCount: isFlawless
          ? 0
          : targetWords.length -
            alignment.filter((a) => a.target && a.typed && a.target === a.typed)
              .length,
        wordBreakdown: targetWords.map((w, idx) => ({
          word: w,
          typed: finalTypedWords[idx] || "",
          latencyMs: Math.round(durationMs / targetWords.length),
          hasError: (finalTypedWords[idx] || "") !== w,
          previousWeight: 1.0,
          newWeight: 1.0,
        })),
      };
      recordTestResult(result);

      if (roundNumber >= TOTAL_ROUNDS) {
        setPhase("SUMMARY");
      } else {
        setPhase("REVIEW");
      }
    },
    [
      targetWords,
      typingStartTime,
      sessionHistory,
      roundNumber,
      recordTestResult,
      TOTAL_ROUNDS,
    ],
  );

  // Next round trigger
  const nextRound = useCallback(() => {
    setRoundNumber((prev) => prev + 1);
    initChunk();
  }, [initChunk]);

  // Keydown listener
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Allow browser shortcuts
      if (
        e.key === "F5" ||
        e.key === "F12" ||
        (e.ctrlKey && (e.key === "r" || e.key === "R"))
      ) {
        return;
      }

      // Quick Restart shortcut
      if (e.key === "Tab") {
        e.preventDefault();
        restartSession();
        return;
      }

      // READY phase: Space or Enter to trigger flash
      if (phase === "READY") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          startMemorizing();
        }
        return;
      }

      // REVIEW phase: Space or Enter to proceed to next chunk
      if (phase === "REVIEW") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          nextRound();
        }
        return;
      }

      // SUMMARY phase: Space or Enter to restart session
      if (phase === "SUMMARY") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          restartSession();
        }
        return;
      }

      // Block navigation arrow keys to prevent accidental scrolling
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
          "PageUp",
          "PageDown",
        ].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      // TYPING phase
      if (phase === "TYPING") {
        // Backspace / Delete: Allow deleting to edit or retype word
        if (e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault();
          if (soundEnabled) playKeyClick(soundProfile);

          // Ctrl+Backspace or Alt+Backspace: delete entire active word
          if (e.ctrlKey || e.altKey) {
            if (currentInput.length > 0) {
              setCurrentInput("");
            } else if (typedWordsList.length > 0 && currentWordIdx > 0) {
              const prevWord = typedWordsList[typedWordsList.length - 1];
              setTypedWordsList((prev) => prev.slice(0, -1));
              setCurrentWordIdx((prev) => Math.max(0, prev - 1));
              setCurrentInput(prevWord);
            }
            return;
          }

          // Single character backspace
          if (currentInput.length > 0) {
            setCurrentInput((prev) => prev.slice(0, -1));
          } else if (typedWordsList.length > 0 && currentWordIdx > 0) {
            // When currentInput is empty, backspace into the previous word to fix/retype it
            const prevWord = typedWordsList[typedWordsList.length - 1];
            setTypedWordsList((prev) => prev.slice(0, -1));
            setCurrentWordIdx((prev) => Math.max(0, prev - 1));
            setCurrentInput(prevWord);
          }
          return;
        }
        // Space (word divider)
        if (e.key === " ") {
          e.preventDefault();
          if (currentInput.length === 0) return;

          if (soundEnabled) playKeyClick(soundProfile);
          const newTypedList = [...typedWordsList, currentInput];
          setTypedWordsList(newTypedList);

          if (currentWordIdx === targetWords.length - 1) {
            // Submitted last word!
            completeChunk(newTypedList);
          } else {
            setCurrentWordIdx((prev) => prev + 1);
            setCurrentInput("");
          }
          return;
        }

        // Enter submits the entire chunk
        if (e.key === "Enter") {
          e.preventDefault();
          const newTypedList = currentInput
            ? [...typedWordsList, currentInput]
            : typedWordsList;
          completeChunk(newTypedList);
          return;
        }

        // Printable char
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          if (soundEnabled) playKeyClick(soundProfile);

          const nextInput = currentInput + e.key;
          setCurrentInput(nextInput);

          // If on the final word and user types whole target word exactly
          if (
            currentWordIdx === targetWords.length - 1 &&
            nextInput === targetWords[targetWords.length - 1]
          ) {
            const finalWords = [...typedWordsList, nextInput];
            completeChunk(finalWords);
          }
        }
      }
    },
    [
      phase,
      currentInput,
      currentWordIdx,
      targetWords,
      typedWordsList,
      soundEnabled,
      startMemorizing,
      nextRound,
      restartSession,
      completeChunk,
      soundProfile,
    ],
  );

  // Auto focus
  useEffect(() => {
    if (phase) {
      containerRef.current?.focus();
    }
  }, [phase]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className="relative w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col gap-6 outline-none py-6 select-none"
    >
      <FocusNotice
        isFocused={isFocused}
        onFocus={() => containerRef.current?.focus()}
      />

      {/* Top Header & Round Progress */}
      <div className="flex items-center justify-between px-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="font-semibold text-[var(--text-main)]">
            Look-ahead & Short-term Memory
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span style={{ color: "var(--text-dim)" }}>
            Round{" "}
            <span style={{ color: "var(--color-primary)" }}>{roundNumber}</span>{" "}
            / {TOTAL_ROUNDS}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, idx) => {
              const item = sessionHistory[idx];
              const isCurrent = idx + 1 === roundNumber && phase !== "SUMMARY";
              return (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full border transition-all ${
                    item
                      ? item.perfect
                        ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                        : "bg-[var(--color-warning)] border-[var(--color-warning)]"
                      : isCurrent
                        ? "border-[var(--color-primary)] animate-pulse"
                        : "border-[var(--border-color)] bg-[var(--bg-card)]"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Flash Arena */}
      <div
        className="relative w-full min-h-[220px] rounded-2xl border p-8 flex flex-col items-center justify-center text-center transition-all duration-300 shadow-xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-sub)",
          borderColor:
            phase === "MEMORIZING"
              ? "var(--color-warning)"
              : phase === "TYPING"
                ? "var(--color-primary)"
                : "var(--border-color)",
        }}
      >
        {/* Memory Countdown Progress Bar (Top border of arena) */}
        {phase === "MEMORIZING" && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--border-color)]">
            <div
              className="h-full transition-all linear"
              style={{
                width: `${countdownProgress}%`,
                backgroundColor: "var(--color-warning)",
              }}
            />
          </div>
        )}

        {/* Phase 1: READY */}
        {phase === "READY" && (
          <div className="flex flex-col items-center gap-4 animate-fadeIn">
            <div
              className="p-3.5 rounded-full border"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
                color: "var(--color-primary)",
              }}
            >
              <Eye className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold text-[var(--text-main)]">
                Ready to Flash {flashChunkSize} Words?
              </h3>
              <p className="text-xs text-[var(--text-dim)] max-w-sm">
                Words will appear for {(flashDurationMs / 1000).toFixed(1)}s
                then vanish. Type them purely from memory.
              </p>
            </div>
            <button
              type="button"
              onClick={startMemorizing}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-transform hover:scale-105 active:scale-95 shadow-md"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--bg-main)",
              }}
            >
              <span>Start Flash</span>
              <kbd className="px-1.5 py-0.5 rounded text-[11px] bg-black/20 font-mono">
                Space
              </kbd>
            </button>
          </div>
        )}

        {/* Phase 2: MEMORIZING */}
        {phase === "MEMORIZING" && (
          <div className="flex flex-col items-center gap-4 animate-flash-pulse">
            <div className="flex items-center gap-2 text-xs text-[var(--color-warning)] font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>
                Memorize Chunk • {(flashDurationMs / 1000).toFixed(1)}s
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-3xl sm:text-4xl font-bold font-mono tracking-wide text-[var(--text-main)] drop-shadow-md">
              {targetWords.map((word, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)]"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Phase 3: TYPING (WORDS ARE FADED/HIDDEN) */}
        {phase === "TYPING" && (
          <div className="w-full flex flex-col items-center gap-6 animate-fadeIn">
            {/* Hidden words indicator */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
              <EyeOff className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Recall & Type {flashChunkSize} words from memory</span>
            </div>

            {/* Input display area */}
            <div className="w-full max-w-xl flex flex-col items-center gap-4">
              <div
                className="w-full min-h-[70px] p-4 rounded-xl border flex flex-wrap items-center justify-center gap-3 text-2xl font-mono"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-active)",
                }}
              >
                {/* Already typed words */}
                {typedWordsList.map((tw, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded border text-sm font-semibold"
                    style={{
                      backgroundColor: "var(--bg-sub)",
                      borderColor: "var(--border-color)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {tw}
                  </span>
                ))}

                {/* Currently active typing word */}
                <div className="flex items-center text-[var(--text-main)] font-semibold">
                  <span>{currentInput}</span>
                  <span
                    className="inline-block w-2.5 h-6 ml-0.5 animate-caret"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                </div>

                {typedWordsList.length === 0 && currentInput === "" && (
                  <span className="text-sm text-[var(--text-dim)] italic">
                    Type the words here...
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-[var(--text-dim)]">
                <span>
                  Word {currentWordIdx + 1} of {targetWords.length}
                </span>
                <span>•</span>
                <span>Backspace to edit</span>
                <span>•</span>
                <span>Space between words</span>
                <span>•</span>
                <span>Enter to finish</span>
              </div>
            </div>
          </div>
        )}

        {/* Phase 4: REVIEW OF CURRENT CHUNK */}
        {phase === "REVIEW" && latestRoundStat && (
          <div className="w-full flex flex-col items-center gap-5 animate-fadeIn">
            <div className="flex items-center gap-2">
              {latestRoundStat.perfect ? (
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Flawless Recall! (100% Accuracy)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-warning)]">
                  <Flame className="w-5 h-5" />
                  <span>
                    Recall Result ({latestRoundStat.accuracy}% Accuracy)
                  </span>
                </div>
              )}
            </div>

            {/* Target vs Typed Word-by-Word Diff Card */}
            <div
              className="w-full max-w-xl flex flex-col gap-3 p-4 rounded-xl border text-left shadow-xs"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
              }}
            >
              <div
                className="text-[10px] uppercase font-bold tracking-wider"
                style={{ color: "var(--text-dim)" }}
              >
                Memory Recall Breakdown
              </div>

              <div className="flex flex-wrap gap-2">
                {latestRoundStat.alignment.map((pair, idx) => {
                  if (pair.isMatch) {
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold"
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                          borderColor: "var(--color-primary)",
                          color: "var(--color-primary)",
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{pair.target}</span>
                      </div>
                    );
                  }

                  if (pair.typed === null) {
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed text-xs font-mono"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.08)",
                          borderColor: "var(--color-error)",
                          color: "var(--color-error)",
                        }}
                      >
                        <span className="line-through opacity-70">
                          {pair.target}
                        </span>
                        <span className="text-[10px] uppercase font-bold">
                          (missing)
                        </span>
                      </div>
                    );
                  }

                  if (pair.target === null) {
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono"
                        style={{
                          backgroundColor: "rgba(139, 92, 246, 0.1)",
                          borderColor: "var(--color-accent)",
                          color: "var(--color-accent)",
                        }}
                      >
                        <span className="line-through">{pair.typed}</span>
                        <span className="text-[10px] uppercase font-bold">
                          (extra)
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono"
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.08)",
                        borderColor: "var(--color-error)",
                        color: "var(--color-error)",
                      }}
                    >
                      <span className="line-through opacity-70">
                        {pair.typed}
                      </span>
                      <span
                        className="text-xs opacity-60"
                        style={{ color: "var(--text-dim)" }}
                      >
                        &rarr;
                      </span>
                      <span className="font-bold underline">{pair.target}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Round Metrics */}
            <div className="flex items-center gap-8 py-1 font-mono">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-primary)]">
                  {latestRoundStat.wpm}
                </div>
                <div className="text-[10px] uppercase text-[var(--text-dim)]">
                  WPM
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-warning)]">
                  {latestRoundStat.accuracy}%
                </div>
                <div className="text-[10px] uppercase text-[var(--text-dim)]">
                  Accuracy
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-info)]">
                  {(latestRoundStat.durationMs / 1000).toFixed(1)}s
                </div>
                <div className="text-[10px] uppercase text-[var(--text-dim)]">
                  Typing Time
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={nextRound}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-transform hover:scale-105 active:scale-95 shadow-md"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--bg-main)",
              }}
            >
              <span>
                Next Chunk ({roundNumber + 1}/{TOTAL_ROUNDS})
              </span>
              <ArrowRight className="w-4 h-4" />
              <kbd className="px-1.5 py-0.5 rounded text-[11px] bg-black/20 font-mono">
                Space
              </kbd>
            </button>
          </div>
        )}

        {/* Phase 5: SESSION SUMMARY */}
        {phase === "SUMMARY" && (
          <div className="w-full flex flex-col items-center gap-6 animate-fadeIn py-2">
            <div
              className="p-3.5 rounded-full border text-[var(--color-primary)]"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
              }}
            >
              <Trophy className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-bold text-[var(--text-main)]">
                Flash Session Complete!
              </h3>
              <p className="text-xs text-[var(--text-dim)]">
                Completed {TOTAL_ROUNDS} look-ahead & short-term memory rounds.
              </p>
            </div>

            {/* Aggregated Session Metrics */}
            {(() => {
              const avgWpm = Math.round(
                sessionHistory.reduce((acc, cur) => acc + cur.wpm, 0) /
                  (sessionHistory.length || 1),
              );
              const avgAcc = Math.round(
                sessionHistory.reduce((acc, cur) => acc + cur.accuracy, 0) /
                  (sessionHistory.length || 1),
              );
              const perfectCount = sessionHistory.filter(
                (s) => s.perfect,
              ).length;

              return (
                <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                  <div
                    className="p-3.5 rounded-xl border text-center"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <div className="text-2xl font-bold text-[var(--color-primary)]">
                      {avgWpm}
                    </div>
                    <div className="text-[11px] text-[var(--text-dim)]">
                      Avg WPM
                    </div>
                  </div>

                  <div
                    className="p-3.5 rounded-xl border text-center"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <div className="text-2xl font-bold text-[var(--color-warning)]">
                      {avgAcc}%
                    </div>
                    <div className="text-[11px] text-[var(--text-dim)]">
                      Avg Accuracy
                    </div>
                  </div>

                  <div
                    className="p-3.5 rounded-xl border text-center"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <div className="text-2xl font-bold text-[var(--color-info)]">
                      {perfectCount}/{TOTAL_ROUNDS}
                    </div>
                    <div className="text-[11px] text-[var(--text-dim)]">
                      Flawless
                    </div>
                  </div>
                </div>
              );
            })()}

            <button
              type="button"
              onClick={restartSession}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-transform hover:scale-105 active:scale-95 shadow-md"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--bg-main)",
              }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
              <kbd className="px-1.5 py-0.5 rounded text-[11px] bg-black/20 font-mono">
                Space
              </kbd>
            </button>
          </div>
        )}
      </div>

      {/* Footer shortcut helper */}
      <div
        className="flex items-center justify-between text-xs px-2"
        style={{ color: "var(--text-dim)" }}
      >
        <button
          type="button"
          onClick={restartSession}
          className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>restart session</span>
          <kbd
            className="px-1.5 py-0.5 rounded border text-[10px]"
            style={{
              backgroundColor: "var(--bg-sub)",
              borderColor: "var(--border-color)",
            }}
          >
            Tab
          </kbd>
        </button>

        <span>
          Look-ahead training strengthens touch-typing buffer & rhythm
        </span>
      </div>
    </div>
  );
};
