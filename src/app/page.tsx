"use client";

import { Keyboard } from "lucide-react";
import { useEffect, useState } from "react";
import { FlashMode } from "@/components/FlashMode";
import { GithubIcon } from "@/components/GithubIcon";
import { Header } from "@/components/Header";
import { SoloTypeIcon } from "@/components/Logo";
import { SingleLetterEngine } from "@/components/SingleLetterEngine";
import { StatsScreen } from "@/components/StatsScreen";
import { TypingEngine } from "@/components/TypingEngine";
import type { TestResult } from "@/lib/types";
import { useHydrated, useTypingStore } from "@/store/useTypingStore";

export default function Home() {
  const isHydrated = useHydrated();

  const { mode, theme, fetchDictionary } = useTypingStore();

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [prioritizeWeakOnly, setPrioritizeWeakOnly] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  // Load 5,000 words dictionary from public URL on first mount if not cached
  useEffect(() => {
    if (isHydrated) {
      fetchDictionary();
    }
  }, [isHydrated, fetchDictionary]);

  // Restart handler
  const handleRestart = () => {
    setTestResult(null);
    setSessionKey((prev) => prev + 1);
  };

  // Handle Practice Weak Only trigger
  const handlePracticeWeakOnly = () => {
    setPrioritizeWeakOnly(true);
    setTestResult(null);
    setSessionKey((prev) => prev + 1);
  };

  // Handle test completion
  const handleTestComplete = (result: TestResult) => {
    setTestResult(result);
  };

  if (!isHydrated) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-sm opacity-60">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>loading solotype engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-theme={theme}
      className="min-h-screen flex flex-col justify-between transition-colors duration-200"
      style={{ backgroundColor: "var(--bg-main)", color: "var(--text-main)" }}
    >
      {/* Top Application Header */}
      <Header
        onOpenDeck={() => setShowDeckModal(true)}
        onRestart={handleRestart}
      />

      {/* Main Interactive Typing Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 w-full">
        {/* If user is viewing test result */}
        {testResult &&
        (mode === "spaced-repetition" || mode === "single-letter") ? (
          <StatsScreen
            result={testResult}
            onRestart={handleRestart}
            onPracticeWeakOnly={handlePracticeWeakOnly}
          />
        ) : (
          <div className="w-full">
            {/* Mode Switch Renderer */}
            {mode === "spaced-repetition" ? (
              <TypingEngine
                key={`spaced-${sessionKey}`}
                prioritizeWeakOnly={prioritizeWeakOnly}
                onExitWeakOnly={() => {
                  setPrioritizeWeakOnly(false);
                  handleRestart();
                }}
                onComplete={handleTestComplete}
              />
            ) : mode === "single-letter" ? (
              <SingleLetterEngine
                key={`letter-${sessionKey}`}
                onComplete={handleTestComplete}
              />
            ) : (
              <FlashMode key={`flash-${sessionKey}`} />
            )}
          </div>
        )}
      </main>

      {/* Full Deck Inspection Modal */}
      {showDeckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 animate-fadeIn">
          <div
            className="w-full max-w-5xl xl:max-w-6xl rounded-2xl border shadow-2xl overflow-hidden p-6"
            style={{
              backgroundColor: "var(--bg-main)",
              borderColor: "var(--border-color)",
            }}
          >
            <StatsScreen
              isDeckModal
              onCloseDeckModal={() => setShowDeckModal(false)}
              onRestart={() => {
                setShowDeckModal(false);
                handleRestart();
              }}
              onPracticeWeakOnly={() => {
                setShowDeckModal(false);
                handlePracticeWeakOnly();
              }}
            />
          </div>
        </div>
      )}

      {/* Minimalist Footer */}
      <footer
        className="w-full max-w-6xl xl:max-w-7xl mx-auto py-6 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs select-none border-t border-transparent"
        style={{ color: "var(--text-dim)" }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>tab: restart</span>
          </div>
          <span>•</span>
          {mode === "single-letter" ? (
            <div className="flex items-center gap-1.5">
              <span>direct keypress (no space needed)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span>space: submit word</span>
            </div>
          )}
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span>
              {mode === "single-letter"
                ? "weak letters prioritized"
                : "no backspace on spaced mode"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/hnamhocit"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub: @hnamhocit"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-sub)]"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-main)",
            }}
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span className="font-semibold">hnamhocit</span>
          </a>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <SoloTypeIcon size={15} />
            <span className="font-semibold">SoloType</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
