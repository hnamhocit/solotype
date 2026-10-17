export type AppTheme =
  | "paper-light"
  | "everforest-light"
  | "catppuccin-latte"
  | "everforest-dark"
  | "catppuccin-mocha"
  | "gruvbox-dark";

export type AppMode = "spaced-repetition" | "single-letter" | "flash-type";
export type SpacedTestType = "words" | "time";
export type HandMode = "both" | "left" | "right";
export type FontSize = "sm" | "md" | "lg";
export type SoundProfile = "thock" | "clicky" | "bubble";
export type CaretStyle = "line" | "underline" | "block";

export interface LetterRecord {
  letter: string;
  totalAttempts: number;
  successAttempts: number;
  lastLatencyMs: number;
  averageLatencyMs: number;
  consecutiveFastStreak: number;
  weight: number;
  lastPracticedAt: number;
  errorCount: number;
}

export interface WordRecord {
  word: string;
  totalAttempts: number;
  successAttempts: number;
  lastLatencyMs: number;
  averageLatencyMs: number;
  consecutiveFastStreak: number;
  weight: number;
  lastPracticedAt: number;
  errorCount: number;
}

export interface TestWordResult {
  word: string;
  typed: string;
  latencyMs: number;
  hasError: boolean;
  previousWeight: number;
  newWeight: number;
}

export interface TestResult {
  id: string;
  timestamp: number;
  mode: AppMode;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  durationMs: number;
  wordCount: number;
  errorCount: number;
  wordBreakdown: TestWordResult[];
}

export interface WordCharState {
  char: string;
  state: "untyped" | "correct" | "incorrect" | "extra";
}
