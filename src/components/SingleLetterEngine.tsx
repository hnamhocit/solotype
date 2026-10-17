"use client";

import { Flame, RotateCcw, Zap } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playErrorSound, playKeyClick } from "@/lib/sound";
import type { TestResult, TestWordResult } from "@/lib/types";
import { useTypingStore } from "@/store/useTypingStore";
import { FocusNotice } from "./FocusNotice";

interface SingleLetterEngineProps {
  onComplete: (result: TestResult) => void;
}

interface LetterStep {
  letter: string;
  typed: string;
  hasError: boolean;
  latencyMs: number;
  previousWeight: number;
  newWeight: number;
}

export const SingleLetterEngine: React.FC<SingleLetterEngineProps> = ({
  onComplete,
}) => {
  const {
    testType,
    handMode,
    targetLetterCount,
    targetTimeSeconds,
    soundEnabled,
    soundProfile,
    fontSize,
    letterRecords,
    globalAverageLatencyMs,
    updateLetterResult,
    getSingleLetters,
    recordTestResult,
  } = useTypingStore();

  const [letters, setLetters] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Timestamps & Metrics
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [letterStartTime, setLetterStartTime] = useState<number | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [mistakeKeystrokes, setMistakeKeystrokes] = useState(0);
  const [stepHistory, setStepHistory] = useState<LetterStep[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(targetTimeSeconds);

  // Live HUD
  const [liveCpm, setLiveCpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  const containerRef = useRef<HTMLDivElement>(null);
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const activeLetterRef = useRef<HTMLDivElement>(null);

  // Identify weak letters (weight >= 1.5)
  const weakLetters = useMemo(() => {
    return Object.values(letterRecords)
      .filter((l) => l.weight >= 1.5)
      .sort((a, b) => b.weight - a.weight);
  }, [letterRecords]);

  // Restart / Init session
  const restartTest = useCallback(() => {
    const count = testType === "time" ? 120 : targetLetterCount;
    const newLetters = getSingleLetters(count);
    setLetters(newLetters);
    setCurrentIdx(0);
    setTestStartTime(null);
    setLetterStartTime(null);
    setTotalKeystrokes(0);
    setMistakeKeystrokes(0);
    setCurrentStreak(0);
    setStepHistory([]);
    setLiveCpm(0);
    setLiveAccuracy(100);
    setRemainingSeconds(targetTimeSeconds);

    if (streamContainerRef.current) {
      streamContainerRef.current.scrollTop = 0;
    }
  }, [getSingleLetters, targetLetterCount, testType, targetTimeSeconds]);

  useEffect(() => {
    restartTest();
  }, [restartTest]);

  // Auto-scroll stream to keep active letter centered
  useEffect(() => {
    if (
      currentIdx >= 0 &&
      activeLetterRef.current &&
      streamContainerRef.current
    ) {
      const container = streamContainerRef.current;
      const element = activeLetterRef.current;
      const offsetTop = element.offsetTop - container.offsetTop;

      if (offsetTop > 70) {
        container.scrollTo({
          top: offsetTop - 35,
          behavior: "smooth",
        });
      } else {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [currentIdx]);

  // Live CPM / Accuracy ticker
  useEffect(() => {
    if (!testStartTime) return;

    const interval = setInterval(() => {
      const elapsedSeconds = (performance.now() - testStartTime) / 1000;
      if (elapsedSeconds < 0.3) return;

      const minutes = elapsedSeconds / 60;
      const cpmVal = Math.round(totalKeystrokes / minutes);
      setLiveCpm(cpmVal);

      if (totalKeystrokes > 0) {
        const acc = Math.max(
          0,
          Math.round(
            ((totalKeystrokes - mistakeKeystrokes) / totalKeystrokes) * 100,
          ),
        );
        setLiveAccuracy(acc);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [testStartTime, totalKeystrokes, mistakeKeystrokes]);

  // Complete session handler
  const handleFinishSession = useCallback(
    (
      finalSteps: LetterStep[],
      finalKeystrokes: number,
      finalMistakes: number,
      finalStartTime: number,
    ) => {
      const durationMs = Math.round(performance.now() - finalStartTime);
      const minutes = durationMs / 60000;
      const correctChars = Math.max(0, finalKeystrokes - finalMistakes);
      const netWpm = Math.max(0, Math.round(correctChars / 5 / minutes));
      const rawWpm = Math.max(0, Math.round(finalKeystrokes / 5 / minutes));

      const accuracy =
        finalKeystrokes > 0
          ? Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  ((finalKeystrokes - finalMistakes) / finalKeystrokes) * 100,
                ),
              ),
            )
          : 100;

      const wordBreakdown: TestWordResult[] = finalSteps.map((s) => ({
        word: s.letter,
        typed: s.typed,
        latencyMs: s.latencyMs,
        hasError: s.hasError,
        previousWeight: s.previousWeight,
        newWeight: s.newWeight,
      }));

      const result: TestResult = {
        id: `letter-${Date.now()}`,
        timestamp: Date.now(),
        mode: "single-letter",
        wpm: netWpm,
        rawWpm,
        accuracy,
        durationMs,
        wordCount: finalSteps.length,
        errorCount: finalMistakes,
        wordBreakdown,
      };

      recordTestResult(result);
      onComplete(result);
    },
    [onComplete, recordTestResult],
  );

  // Time mode countdown
  useEffect(() => {
    if (testType !== "time" || !testStartTime) return;

    const interval = setInterval(() => {
      const elapsedSec = (performance.now() - testStartTime) / 1000;
      const left = Math.max(0, Math.ceil(targetTimeSeconds - elapsedSec));
      setRemainingSeconds(left);

      if (left <= 0) {
        clearInterval(interval);
        handleFinishSession(
          stepHistory,
          totalKeystrokes,
          mistakeKeystrokes,
          testStartTime,
        );
      }
    }, 150);

    return () => clearInterval(interval);
  }, [
    testType,
    testStartTime,
    targetTimeSeconds,
    stepHistory,
    totalKeystrokes,
    mistakeKeystrokes,
    handleFinishSession,
  ]);

  // Keydown listener
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Browser shortcuts
      if (
        e.key === "F5" ||
        e.key === "F12" ||
        (e.ctrlKey && (e.key === "r" || e.key === "R"))
      ) {
        return;
      }

      if (e.getModifierState) {
        setCapsLockActive(e.getModifierState("CapsLock"));
      }

      // Quick restart
      if (e.key === "Tab") {
        e.preventDefault();
        restartTest();
        return;
      }

      // Block navigation keys
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
          "Backspace",
          "Delete",
        ].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      // Printable single character (a-z)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();

        const expectedLetter = letters[currentIdx];
        if (!expectedLetter) return;

        const now = performance.now();

        let activeStart = testStartTime;
        if (!activeStart) {
          activeStart = now;
          setTestStartTime(now);
        }

        let activeLetterTime = letterStartTime;
        if (!activeLetterTime) {
          activeLetterTime = now;
          setLetterStartTime(now);
        }

        const latency = Math.round(now - activeLetterTime);
        const typedChar = e.key.toLowerCase();
        const isCorrect = typedChar === expectedLetter.toLowerCase();

        if (isCorrect) {
          if (soundEnabled) playKeyClick(soundProfile);
          setCurrentStreak((prev) => prev + 1);
        } else {
          if (soundEnabled) playErrorSound();
          setCurrentStreak(0);
          setMistakeKeystrokes((prev) => prev + 1);
        }

        const newTotalKeystrokes = totalKeystrokes + 1;
        setTotalKeystrokes(newTotalKeystrokes);

        // Update Spaced Repetition for this single letter
        const { record, weightDelta } = updateLetterResult(
          expectedLetter,
          !isCorrect,
          latency,
        );

        const stepResult: LetterStep = {
          letter: expectedLetter,
          typed: typedChar,
          hasError: !isCorrect,
          latencyMs: latency,
          previousWeight: Number((record.weight - weightDelta).toFixed(2)),
          newWeight: record.weight,
        };

        const updatedSteps = [...stepHistory, stepResult];
        setStepHistory(updatedSteps);

        // In count mode: finish on last letter
        if (testType === "words" && currentIdx === letters.length - 1) {
          handleFinishSession(
            updatedSteps,
            newTotalKeystrokes,
            mistakeKeystrokes + (!isCorrect ? 1 : 0),
            activeStart,
          );
          return;
        }

        // In time mode: append more if nearing end of stream
        if (testType === "time" && currentIdx >= letters.length - 15) {
          const extra = getSingleLetters(40);
          setLetters((prev) => [...prev, ...extra]);
        }

        setCurrentIdx((prev) => prev + 1);
        setLetterStartTime(performance.now());
      }
    },
    [
      letters,
      currentIdx,
      testStartTime,
      letterStartTime,
      totalKeystrokes,
      mistakeKeystrokes,
      soundEnabled,
      soundProfile,
      stepHistory,
      testType,
      restartTest,
      updateLetterResult,
      handleFinishSession,
      getSingleLetters,
    ],
  );

  // Auto focus
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Font size configuration
  const fontStyles = {
    sm: "text-2xl sm:text-3xl gap-3 sm:gap-4",
    md: "text-3xl sm:text-4xl gap-4 sm:gap-5",
    lg: "text-4xl sm:text-5xl gap-5 sm:gap-6",
  }[fontSize];

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className="relative w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col gap-4 outline-none py-2 select-none"
    >
      <FocusNotice
        isFocused={isFocused}
        onFocus={() => containerRef.current?.focus()}
      />

      {/* Single Letter HUD */}
      <div className="flex items-center justify-between px-2 text-xs font-mono">
        <div className="flex items-baseline gap-6">
          {/* Live CPM / WPM */}
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              {liveCpm}
            </span>
            <span style={{ color: "var(--text-dim)" }}>cpm</span>
            <span className="text-[11px] opacity-60">
              ({Math.round(liveCpm / 5)} wpm)
            </span>
          </div>

          {/* Accuracy */}
          <div className="flex items-baseline gap-1">
            <span
              className="text-2xl font-bold"
              style={{
                color:
                  liveAccuracy >= 95
                    ? "var(--color-primary)"
                    : liveAccuracy >= 80
                      ? "var(--color-warning)"
                      : "var(--color-error)",
              }}
            >
              {liveAccuracy}%
            </span>
            <span style={{ color: "var(--text-dim)" }}>acc</span>
          </div>

          {/* Latency Avg */}
          <div className="hidden sm:flex items-center gap-1 text-[var(--text-dim)]">
            <Zap className="w-3.5 h-3.5 text-[var(--color-warning)]" />
            <span>avg {globalAverageLatencyMs}ms</span>
          </div>

          {/* Hand isolation tag */}
          {handMode !== "both" && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] bg-[var(--bg-card)] px-2 py-0.5 rounded border border-[var(--border-color)]">
              {handMode === "left" ? "👈 Left Hand Only" : "👉 Right Hand Only"}
            </span>
          )}

          {/* Streak indicator */}
          {currentStreak >= 5 && (
            <span className="flex items-center gap-1 text-[var(--color-warning)] text-[11px] font-bold">
              <Flame className="w-3.5 h-3.5" />
              <span>{currentStreak}x streak</span>
            </span>
          )}
        </div>

        {/* Right side: Weak Keys list & Progress */}
        <div className="flex items-center gap-4">
          {weakLetters.length > 0 && (
            <div
              className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
                color: "var(--color-warning)",
              }}
              title="Letters currently targeted by Spaced Repetition"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Weak keys:</span>
              <span className="font-bold">
                {weakLetters
                  .slice(0, 4)
                  .map((l) => l.letter)
                  .join(", ")}
              </span>
            </div>
          )}

          {testType === "time" ? (
            <div
              className="text-base font-bold font-mono"
              style={{
                color:
                  remainingSeconds <= 5
                    ? "var(--color-error)"
                    : "var(--color-primary)",
              }}
            >
              <span>{remainingSeconds}s</span>
            </div>
          ) : (
            <div
              className="text-xs font-semibold"
              style={{ color: "var(--text-dim)" }}
            >
              <span style={{ color: "var(--color-primary)" }}>
                {currentIdx + 1}
              </span>
              <span> / {letters.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Single Letter Stream Area */}
      <div
        ref={streamContainerRef}
        className={`relative w-full h-[220px] overflow-hidden select-none flex flex-wrap content-start items-center font-mono transition-all px-4 py-4 rounded-2xl border ${fontStyles}`}
        style={{
          backgroundColor: "var(--bg-sub)",
          borderColor: "var(--border-color)",
        }}
      >
        {letters.map((letter, idx) => {
          const isCurrent = idx === currentIdx;
          const isPassed = idx < currentIdx;
          const stepData = stepHistory[idx];

          return (
            <div
              key={`${letter}-${idx}`}
              ref={isCurrent ? activeLetterRef : null}
              className={`relative flex items-center justify-center min-w-[36px] sm:min-w-[44px] h-[48px] sm:h-[56px] rounded-lg transition-all ${
                isCurrent
                  ? "bg-[var(--bg-card)] border-2 border-[var(--color-primary)] shadow-md scale-110 z-10 font-bold"
                  : isPassed
                    ? stepData?.hasError
                      ? "text-[var(--color-error)] bg-[var(--color-error)]/10 line-through decoration-2"
                      : "text-[var(--color-primary)] font-semibold opacity-60"
                    : "text-[var(--text-untyped)] opacity-70"
              }`}
            >
              <span className="select-none uppercase">{letter}</span>

              {/* Glowing smooth caret indicator on active letter */}
              {isCurrent && isFocused && (
                <span
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Shortcuts / Instructions */}
      <div
        className="w-full flex items-center justify-between text-xs px-2 pt-1 select-none font-mono"
        style={{ color: "var(--text-dim)" }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={restartTest}
            className="flex items-center gap-1.5 transition-colors hover:text-[var(--color-primary)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>restart test</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg-sub)] border border-[var(--border-color)]">
              tab
            </kbd>
          </button>
        </div>

        {capsLockActive && (
          <div className="text-[var(--color-error)] text-[11px] animate-pulse">
            Caps Lock is ON
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px]">
          <span>nhấn phím tương ứng</span>
          <span>•</span>
          <span>luyện phản xạ phím yếu</span>
        </div>
      </div>
    </div>
  );
};
