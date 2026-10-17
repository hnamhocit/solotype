"use client";

import { AlertCircle, Flame, RotateCcw, Zap } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { playErrorSound, playKeyClick } from "@/lib/sound";
import type { TestResult, TestWordResult, WordRecord } from "@/lib/types";
import { useTypingStore } from "@/store/useTypingStore";
import { FocusNotice } from "./FocusNotice";

interface TypingEngineProps {
  onComplete: (result: TestResult) => void;
  prioritizeWeakOnly?: boolean;
  onExitWeakOnly?: () => void;
}

export const TypingEngine: React.FC<TypingEngineProps> = ({
  onComplete,
  prioritizeWeakOnly = false,
  onExitWeakOnly,
}) => {
  const {
    dictionary,
    testType,
    handMode,
    targetWordCount,
    targetTimeSeconds,
    soundEnabled,
    soundProfile,
    caretStyle,
    fontSize,
    wordRecords,
    globalAverageLatencyMs,
    updateWordResult,
    getSpacedWords,
    recordTestResult,
  } = useTypingStore();

  const debtCount = Object.values(wordRecords).filter(
    (w) => w.weight >= 1.5,
  ).length;
  const isDebtCapped = debtCount >= 50;

  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [isFocused, setIsFocused] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Performance timestamps & stats
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [wordStartTime, setWordStartTime] = useState<number | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [mistakeKeystrokes, setMistakeKeystrokes] = useState(0);
  const [wordBreakdown, setWordBreakdown] = useState<TestWordResult[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(targetTimeSeconds);

  // Live HUD metrics
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  // Smooth sliding caret position
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 26 });

  const containerRef = useRef<HTMLDivElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);

  // Sync remainingSeconds when targetTimeSeconds or testType changes
  useEffect(() => {
    setRemainingSeconds(targetTimeSeconds);
  }, [targetTimeSeconds]);

  // Initialize or restart test
  const restartTest = useCallback(() => {
    const wordCount = testType === "time" ? 60 : targetWordCount;
    const newWords = getSpacedWords(wordCount, prioritizeWeakOnly);
    setWords(newWords);
    setCurrentWordIndex(0);
    setCurrentInput("");
    setTestStartTime(null);
    setWordStartTime(null);
    setTotalKeystrokes(0);
    setMistakeKeystrokes(0);
    setCurrentStreak(0);
    setWordBreakdown([]);
    setLiveWpm(0);
    setLiveAccuracy(100);
    setRemainingSeconds(targetTimeSeconds);

    // Auto-scroll words container to top
    if (wordsContainerRef.current) {
      wordsContainerRef.current.scrollTop = 0;
    }
  }, [
    getSpacedWords,
    targetWordCount,
    testType,
    targetTimeSeconds,
    prioritizeWeakOnly,
  ]);

  // Load words when dictionary is ready or restartTest changes
  useEffect(() => {
    if (dictionary.length > 0) {
      restartTest();
    }
  }, [dictionary.length, restartTest]);

  // Keep active word in comfortable scroll view (smooth 3-line centering)
  useEffect(() => {
    if (
      currentWordIndex >= 0 &&
      activeWordRef.current &&
      wordsContainerRef.current
    ) {
      const container = wordsContainerRef.current;
      const element = activeWordRef.current;

      const wordTop = element.offsetTop;
      const wordHeight = element.offsetHeight || 36;
      const containerHeight = container.clientHeight || 135;

      // Keep active line centered vertically in the 3-line view
      // Middle target: active word sits in the middle row (containerHeight / 2 - wordHeight / 2)
      const targetScrollTop = Math.max(
        0,
        Math.round(wordTop - (containerHeight / 2 - wordHeight / 2)),
      );

      // Only scroll when crossing to a new line / offset
      if (Math.abs(container.scrollTop - targetScrollTop) > 6) {
        container.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      }
    }
  }, [currentWordIndex]);

  // Smooth sliding caret positioning
  const updateCaretPosition = useCallback(() => {
    if (activeCharRef.current && wordsContainerRef.current) {
      const container = wordsContainerRef.current;
      const charEl = activeCharRef.current;
      const containerRect = container.getBoundingClientRect();
      const charRect = charEl.getBoundingClientRect();

      setCaretPos({
        left: Math.round(
          charRect.left - containerRect.left + container.scrollLeft,
        ),
        top: Math.round(charRect.top - containerRect.top + container.scrollTop),
        height: Math.max(22, Math.round(charRect.height)),
      });
    }
  }, []);

  useEffect(() => {
    if (
      currentWordIndex >= 0 &&
      currentInput !== undefined &&
      words.length > 0 &&
      fontSize
    ) {
      updateCaretPosition();
    }
  }, [currentWordIndex, currentInput, words, fontSize, updateCaretPosition]);

  useEffect(() => {
    window.addEventListener("resize", updateCaretPosition);
    return () => window.removeEventListener("resize", updateCaretPosition);
  }, [updateCaretPosition]);

  // Live WPM and Accuracy timer ticker
  useEffect(() => {
    if (!testStartTime) return;

    const interval = setInterval(() => {
      const elapsedSeconds = (performance.now() - testStartTime) / 1000;
      if (elapsedSeconds < 0.5) return;

      const typedChars = totalKeystrokes;
      const minutes = elapsedSeconds / 60;
      const rawWpmVal = Math.round(typedChars / 5 / minutes);
      setLiveWpm(Math.max(0, rawWpmVal));

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

  // Finish test handler
  const handleFinishTest = useCallback(
    (
      finalBreakdown: TestWordResult[],
      finalTotalKeystrokes: number,
      finalMistakes: number,
      finalStartTime: number,
    ) => {
      const now = performance.now();
      const durationMs = Math.round(now - finalStartTime);
      const minutes = durationMs / 60000;

      const correctChars = Math.max(0, finalTotalKeystrokes - finalMistakes);
      const netWpm = Math.max(0, Math.round(correctChars / 5 / minutes));
      const rawWpm = Math.max(
        0,
        Math.round(finalTotalKeystrokes / 5 / minutes),
      );
      const accuracy =
        finalTotalKeystrokes > 0
          ? Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  ((finalTotalKeystrokes - finalMistakes) /
                    finalTotalKeystrokes) *
                    100,
                ),
              ),
            )
          : 100;

      const totalErrors = finalBreakdown.filter((w) => w.hasError).length;

      const result: TestResult = {
        id: `test-${Date.now()}`,
        timestamp: Date.now(),
        mode: "spaced-repetition",
        wpm: netWpm,
        rawWpm,
        accuracy,
        durationMs,
        wordCount: finalBreakdown.length,
        errorCount: totalErrors,
        wordBreakdown: finalBreakdown,
      };

      recordTestResult(result);
      onComplete(result);
    },
    [onComplete, recordTestResult],
  );

  // Countdown timer for Time Mode
  useEffect(() => {
    if (testType !== "time" || !testStartTime) return;

    const interval = setInterval(() => {
      const now = performance.now();
      const elapsedSec = (now - testStartTime) / 1000;
      const left = Math.max(0, Math.ceil(targetTimeSeconds - elapsedSec));
      setRemainingSeconds(left);

      if (left <= 0) {
        clearInterval(interval);
        handleFinishTest(
          wordBreakdown,
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
    wordBreakdown,
    totalKeystrokes,
    mistakeKeystrokes,
    handleFinishTest,
  ]);

  // Keydown Event Handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Allow browser reload and devtools
      if (
        e.key === "F5" ||
        e.key === "F12" ||
        (e.ctrlKey && (e.key === "r" || e.key === "R" || e.key === "i"))
      ) {
        return;
      }

      // Check Caps Lock
      if (e.getModifierState) {
        setCapsLockActive(e.getModifierState("CapsLock"));
      }

      // Quick restart shortcut: Tab
      if (e.key === "Tab") {
        e.preventDefault();
        restartTest();
        return;
      }

      // STRICTLY BLOCK Backspace, Delete, and navigation arrow keys ("ko cho xoa back de quay lai")
      if (
        [
          "Backspace",
          "Delete",
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

      const targetWord = words[currentWordIndex];
      if (!targetWord) return;

      const now = performance.now();

      // Start timing upon first keystroke
      let activeStartTime = testStartTime;
      if (!activeStartTime) {
        activeStartTime = now;
        setTestStartTime(now);
      }

      let activeWordTime = wordStartTime;
      if (!activeWordTime) {
        activeWordTime = now;
        setWordStartTime(now);
      }

      // Handle Space (Word Submission)
      if (e.key === " ") {
        e.preventDefault();
        // Prevent accidental double-space from skipping next word
        if (currentInput.length === 0) return;

        const wordLatency = Math.round(now - activeWordTime);
        const hasError = currentInput !== targetWord;

        const { record, weightDelta } = updateWordResult(
          targetWord,
          hasError,
          wordLatency,
        );

        const wordResult: TestWordResult = {
          word: targetWord,
          typed: currentInput,
          latencyMs: wordLatency,
          hasError,
          previousWeight: Number((record.weight - weightDelta).toFixed(2)),
          newWeight: record.weight,
        };

        const updatedBreakdown = [...wordBreakdown, wordResult];
        setWordBreakdown(updatedBreakdown);

        const newTotalKeystrokes = totalKeystrokes + 1;
        setTotalKeystrokes(newTotalKeystrokes);

        if (soundEnabled) {
          if (hasError) {
            playErrorSound();
          } else {
            playKeyClick(soundProfile);
          }
        }

        // Complete test if on last word in words mode
        if (testType === "words" && currentWordIndex === words.length - 1) {
          handleFinishTest(
            updatedBreakdown,
            newTotalKeystrokes,
            mistakeKeystrokes,
            activeStartTime,
          );
          return;
        }

        // In time mode, if getting close to end of word list, dynamically append more
        if (testType === "time" && currentWordIndex >= words.length - 8) {
          const extraWords = getSpacedWords(30, prioritizeWeakOnly);
          setWords((prev) => [...prev, ...extraWords]);
        }

        setCurrentWordIndex((prev) => prev + 1);
        setCurrentInput("");
        setWordStartTime(performance.now());
        return;
      }

      // Handle Printable Characters (a-z, etc.)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();

        const expectedChar = targetWord[currentInput.length];
        const isCorrect = e.key === expectedChar;

        if (isCorrect) {
          if (soundEnabled) playKeyClick(soundProfile);
          setCurrentStreak((prev) => prev + 1);
        } else {
          // Gõ sai: phát âm thanh lỗi, tăng mistake, reset streak, NHƯNG CHO GÕ TIẾP TỪ NÀY
          if (soundEnabled) playErrorSound();
          setCurrentStreak(0);
          setMistakeKeystrokes((prev) => prev + 1);
        }

        const newTotalKeystrokes = totalKeystrokes + 1;
        setTotalKeystrokes(newTotalKeystrokes);

        const nextInput = currentInput + e.key;
        setCurrentInput(nextInput);

        // Immediate completion on the very last word when in words mode and typed fully & correctly
        if (
          testType === "words" &&
          currentWordIndex === words.length - 1 &&
          nextInput === targetWord
        ) {
          const wordLatency = Math.round(now - activeWordTime);
          const { record, weightDelta } = updateWordResult(
            targetWord,
            false,
            wordLatency,
          );

          const finalWordResult: TestWordResult = {
            word: targetWord,
            typed: nextInput,
            latencyMs: wordLatency,
            hasError: false,
            previousWeight: Number((record.weight - weightDelta).toFixed(2)),
            newWeight: record.weight,
          };

          const finalBreakdown = [...wordBreakdown, finalWordResult];
          setWordBreakdown(finalBreakdown);
          handleFinishTest(
            finalBreakdown,
            newTotalKeystrokes,
            mistakeKeystrokes,
            activeStartTime,
          );
        }
      }
    },
    [
      words,
      currentWordIndex,
      currentInput,
      testStartTime,
      wordStartTime,
      soundEnabled,
      soundProfile,
      updateWordResult,
      wordBreakdown,
      totalKeystrokes,
      mistakeKeystrokes,
      handleFinishTest,
      restartTest,
      testType,
      getSpacedWords,
      prioritizeWeakOnly,
    ],
  );

  // Focus container automatically
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Compute stats about current word
  const currentTargetWord = words[currentWordIndex] || "";
  const currentRecord: WordRecord | undefined = wordRecords[currentTargetWord];
  const isTargetWeak = currentRecord && currentRecord.weight >= 1.5;

  const fontSizeConfig =
    fontSize === "sm"
      ? {
          container: "text-base sm:text-lg leading-relaxed gap-x-3 gap-y-1.5",
          height: "h-[120px]",
        }
      : fontSize === "lg"
        ? {
            container: "text-xl sm:text-2xl leading-relaxed gap-x-4 gap-y-2",
            height: "h-[155px]",
          }
        : {
            container:
              "text-lg sm:text-[1.25rem] leading-relaxed gap-x-3.5 gap-y-1.5",
            height: "h-[135px]",
          };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className="relative w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col gap-3 outline-none py-2 select-none"
    >
      {/* Click-to-focus Overlay */}
      <FocusNotice
        isFocused={isFocused}
        onFocus={() => containerRef.current?.focus()}
      />

      {/* Real-time Performance HUD */}
      <div className="flex items-center justify-between px-1 text-xs font-mono">
        {/* Left: Live WPM & Accuracy */}
        <div className="flex items-baseline gap-5">
          <div className="flex items-baseline gap-1">
            <span
              className="text-2xl font-bold transition-all"
              style={{ color: "var(--color-primary)" }}
            >
              {liveWpm}
            </span>
            <span style={{ color: "var(--text-dim)" }}>wpm</span>
          </div>

          <div className="flex items-baseline gap-1">
            <span
              className="text-2xl font-bold transition-all"
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

          {/* User Latency Benchmark */}
          <div className="hidden sm:flex items-center gap-1 text-[var(--text-dim)]">
            <Zap className="w-3.5 h-3.5 text-[var(--color-warning)]" />
            <span>avg {globalAverageLatencyMs}ms</span>
          </div>

          {/* Targeted Weak review indicator */}
          {prioritizeWeakOnly && onExitWeakOnly && (
            <span className="flex items-center gap-1 text-[var(--color-warning)] font-medium">
              <Flame className="w-3.5 h-3.5" />
              <span>Focused</span>
              <button
                type="button"
                onClick={onExitWeakOnly}
                className="underline text-[10px] ml-0.5 opacity-80 hover:opacity-100"
              >
                (exit)
              </button>
            </span>
          )}

          {/* Combo / Streak Indicator */}
          {currentStreak >= 5 && (
            <span className="flex items-center gap-1 text-[var(--color-warning)] text-[11px] font-bold">
              <Flame className="w-3 h-3" />
              <span>{currentStreak}x</span>
            </span>
          )}
        </div>

        {/* Right: Word Counter / Timer & Spaced Tag */}
        <div className="flex items-center gap-3">
          {/* Hand isolation badge */}
          {handMode !== "both" && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] bg-[var(--bg-card)] px-2 py-0.5 rounded border border-[var(--border-color)]">
              {handMode === "left" ? "👈 Left Hand" : "👉 Right Hand"}
            </span>
          )}

          {/* Debt Indicator */}
          <span
            className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold ${
              isDebtCapped
                ? "text-[var(--color-error)] animate-pulse"
                : "text-[var(--text-dim)]"
            }`}
            title="Spaced Repetition Debt (Capped at 50 max)"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>debt {debtCount}/50</span>
          </span>

          {isTargetWeak && (
            <span className="text-[var(--color-warning)] text-[11px]">
              wt: {currentRecord.weight.toFixed(1)}
            </span>
          )}

          {testType === "time" ? (
            <div
              className="text-sm font-bold font-mono flex items-center gap-1"
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
                {currentWordIndex + 1}
              </span>
              <span> / {words.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Words Display Area (Floating Monkeytype layout with Smooth Caret) */}
      <div
        ref={wordsContainerRef}
        className={`relative w-full ${fontSizeConfig.height} overflow-hidden select-none flex flex-wrap content-start font-mono transition-all px-2 py-2 ${fontSizeConfig.container}`}
      >
        {/* Smooth sliding glowing caret */}
        {isFocused && (
          <span
            className="smooth-caret-cursor absolute pointer-events-none rounded-xs animate-caret"
            style={{
              left: `${caretPos.left}px`,
              top: `${caretPos.top}px`,
              width:
                caretStyle === "line"
                  ? "2.5px"
                  : caretStyle === "block"
                    ? "13px"
                    : "15px",
              height:
                caretStyle === "underline" ? "3px" : `${caretPos.height}px`,
              backgroundColor: "var(--color-primary)",
              transform:
                caretStyle === "underline"
                  ? `translateY(${caretPos.height - 4}px)`
                  : "none",
              boxShadow: "0 0 10px var(--color-primary)",
              zIndex: 10,
            }}
          />
        )}

        {words.map((word, wIdx) => {
          const isCurrent = wIdx === currentWordIndex;
          const isPassed = wIdx < currentWordIndex;
          const passedData = wordBreakdown[wIdx];

          return (
            <div
              key={`${word}-${wIdx}`}
              ref={isCurrent ? activeWordRef : null}
              className="relative flex items-center transition-all"
            >
              {/* Word Characters Rendering */}
              {isPassed ? (
                // Past typed words - soft muted with clear strikethrough if failed
                <span
                  className={
                    passedData?.hasError
                      ? "text-[var(--color-error)] line-through decoration-[var(--color-error)] decoration-2 opacity-75"
                      : "text-[var(--text-passed)]"
                  }
                >
                  {word}
                </span>
              ) : isCurrent ? (
                // Active typing word
                <div className="relative flex items-center font-medium">
                  {word.split("").map((char, cIdx) => {
                    const typedChar = currentInput[cIdx];
                    const isTyped = typedChar !== undefined;
                    const isCharCorrect = typedChar === char;
                    const isCaretSlot = cIdx === currentInput.length;

                    return (
                      <span
                        key={cIdx}
                        ref={isCaretSlot ? activeCharRef : null}
                        className="relative"
                      >
                        <span
                          className={
                            !isTyped
                              ? "text-[var(--text-untyped)]"
                              : isCharCorrect
                                ? "text-[var(--color-primary)] font-semibold animate-char-pop"
                                : "text-[var(--color-error)] bg-[var(--color-error)]/20 rounded-xs"
                          }
                        >
                          {char}
                        </span>
                      </span>
                    );
                  })}

                  {/* Extra characters typed beyond target word length */}
                  {currentInput.length > word.length &&
                    currentInput
                      .slice(word.length)
                      .split("")
                      .map((extraChar, eIdx) => {
                        const isCaretSlot =
                          word.length + eIdx + 1 === currentInput.length;
                        return (
                          <span
                            key={`extra-${eIdx}`}
                            ref={isCaretSlot ? activeCharRef : null}
                            className="text-[var(--color-accent)] opacity-90 underline decoration-wavy"
                          >
                            {extraChar}
                          </span>
                        );
                      })}

                  {/* Trailing slot for smooth caret when user typed entire word */}
                  {currentInput.length >= word.length && (
                    <span
                      ref={activeCharRef}
                      className="inline-block w-[1px] h-5 ml-[1px] pointer-events-none"
                    />
                  )}
                </div>
              ) : (
                // Future words yet to be typed - High contrast, clearly legible!
                <span className="text-[var(--text-untyped)] font-normal transition-colors">
                  {word}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Instructions & Shortcuts */}
      <div
        className="flex flex-wrap items-center justify-between text-xs px-1 gap-4 opacity-70 transition-opacity hover:opacity-100"
        style={{ color: "var(--text-dim)" }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={restartTest}
            className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>restart</span>
            <kbd
              className="px-1.5 py-0.5 rounded border text-[10px]"
              style={{
                backgroundColor: "var(--bg-sub)",
                borderColor: "var(--border-color)",
              }}
            >
              tab
            </kbd>
          </button>
        </div>

        {/* CapsLock Warning */}
        {capsLockActive && (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] animate-pulse"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              borderColor: "var(--color-error)",
              color: "var(--color-error)",
            }}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Caps Lock is ON</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px]">
          <span>chặn backspace</span>
          <span>•</span>
          <span>gõ tiếp từ & space chuyển từ</span>
        </div>
      </div>
    </div>
  );
};
