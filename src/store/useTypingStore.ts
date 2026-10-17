import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_FLASH_CHUNK_SIZE,
  DEFAULT_FLASH_DURATION_MS,
  DEFAULT_FLASH_TOTAL_ROUNDS,
  DEFAULT_TARGET_LETTERS,
  DEFAULT_TARGET_TIME_SECONDS,
  DEFAULT_TARGET_WORDS,
  INITIAL_FALLBACK_DICTIONARY,
  VOCABULARY_FALLBACK_URL,
  VOCABULARY_URL,
  WEAK_WORD_THRESHOLD,
} from "@/lib/constants";
import {
  calculateUpdatedLetterRecord,
  calculateUpdatedWordRecord,
  generateFlashChunkWords,
  generateSingleLetters,
  generateSpacedRepetitionWords,
} from "@/lib/spacedRepetition";
import type {
  AppMode,
  AppTheme,
  CaretStyle,
  FontSize,
  HandMode,
  LetterRecord,
  SoundProfile,
  SpacedTestType,
  TestResult,
  WordRecord,
} from "@/lib/types";

interface TypingStoreState {
  // Theme & Sound Preferences
  theme: AppTheme;
  soundEnabled: boolean;
  soundProfile: SoundProfile;
  caretStyle: CaretStyle;
  fontSize: FontSize;
  setTheme: (theme: AppTheme) => void;
  toggleLightDark: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundProfile: (profile: SoundProfile) => void;
  setCaretStyle: (style: CaretStyle) => void;
  setFontSize: (size: FontSize) => void;

  // Mode Selection
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Vocabulary Cache (5,000 words)
  dictionary: string[];
  isDictionaryLoading: boolean;
  dictionaryError: string | null;
  fetchDictionary: (force?: boolean) => Promise<void>;

  // Spaced Repetition Learning State
  wordRecords: Record<string, WordRecord>;
  globalAverageLatencyMs: number;
  totalWordsTyped: number;

  // Test Configurations
  testType: SpacedTestType;
  setTestType: (type: SpacedTestType) => void;
  handMode: HandMode;
  setHandMode: (mode: HandMode) => void;
  targetWordCount: number;
  setTargetWordCount: (count: number) => void;
  targetTimeSeconds: number;
  setTargetTimeSeconds: (seconds: number) => void;

  // Flash Mode Configurations
  flashChunkSize: number;
  flashDurationMs: number;
  flashTotalRounds: number;
  setFlashChunkSize: (size: number) => void;
  setFlashDurationMs: (ms: number) => void;
  setFlashTotalRounds: (rounds: number) => void;

  // Test History & Results
  history: TestResult[];
  recordTestResult: (result: TestResult) => void;
  clearHistory: () => void;
  resetWordRecords: () => void;

  // Operations
  updateWordResult: (
    word: string,
    hasError: boolean,
    latencyMs: number,
  ) => { record: WordRecord; weightDelta: number };
  getSpacedWords: (count?: number, prioritizeWeakOnly?: boolean) => string[];
  getFlashChunk: (chunkSize?: number) => string[];

  // Single Letter Learning State & Operations
  letterRecords: Record<string, LetterRecord>;
  targetLetterCount: number;
  setTargetLetterCount: (count: number) => void;
  updateLetterResult: (
    letter: string,
    hasError: boolean,
    latencyMs: number,
  ) => { record: LetterRecord; weightDelta: number };
  getSingleLetters: (count?: number) => string[];
  resetLetterRecords: () => void;
}

export const useTypingStore = create<TypingStoreState>()(
  persist(
    (set, get) => ({
      // Theme defaults to Paper Light (Clean, High Contrast)
      theme: "paper-light",
      soundEnabled: true,
      soundProfile: "thock",
      caretStyle: "line",
      fontSize: "md",
      setTheme: (theme) => set({ theme }),
      toggleLightDark: () => {
        const current = get().theme;
        const isDark =
          current.includes("dark") || current === "catppuccin-mocha";
        set({ theme: isDark ? "paper-light" : "everforest-dark" });
      },
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setSoundProfile: (soundProfile) => set({ soundProfile }),
      setCaretStyle: (caretStyle) => set({ caretStyle }),
      setFontSize: (fontSize) => set({ fontSize }),

      // Mode default
      mode: "spaced-repetition",
      setMode: (mode) => set({ mode }),

      // Dictionary initialized with clean fallback words
      dictionary: INITIAL_FALLBACK_DICTIONARY,
      isDictionaryLoading: false,
      dictionaryError: null,

      fetchDictionary: async (force = false) => {
        const { dictionary, isDictionaryLoading } = get();

        // If we already have a rich dictionary cached (e.g. >= 2000 words) and not forced, skip refetch
        if (!force && dictionary && dictionary.length >= 2000) {
          return;
        }

        if (isDictionaryLoading) return;

        set({ isDictionaryLoading: true, dictionaryError: null });

        try {
          let text = "";
          try {
            const res = await fetch(VOCABULARY_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            text = await res.text();
          } catch {
            // Try secondary fallback URL if primary fails
            const res2 = await fetch(VOCABULARY_FALLBACK_URL);
            if (!res2.ok) throw new Error(`HTTP fallback ${res2.status}`);
            text = await res2.text();
          }

          // Parse and clean lines
          const words = text
            .split(/[\r\n]+/)
            .map((w) => w.trim().toLowerCase())
            .filter((w) => /^[a-z]{2,14}$/.test(w));

          // Extract first 5,000 words as specified
          const top5000 = words.slice(0, 5000);

          if (top5000.length > 500) {
            set({
              dictionary: top5000,
              isDictionaryLoading: false,
              dictionaryError: null,
            });
          } else {
            throw new Error("Received insufficient words from public source");
          }
        } catch (err) {
          console.warn(
            "Failed to fetch public dictionary, keeping fallback dictionary:",
            err,
          );
          set({
            isDictionaryLoading: false,
            dictionaryError:
              err instanceof Error ? err.message : "Dictionary fetch failed",
          });
        }
      },

      // Learning state
      wordRecords: {},
      globalAverageLatencyMs: 320, // default initial baseline ~320ms per word
      totalWordsTyped: 0,

      // Test configuration
      testType: "words",
      setTestType: (testType) => set({ testType }),
      handMode: "both",
      setHandMode: (handMode) => set({ handMode }),
      targetWordCount: DEFAULT_TARGET_WORDS,
      setTargetWordCount: (count) => set({ targetWordCount: count }),
      targetTimeSeconds: DEFAULT_TARGET_TIME_SECONDS,
      setTargetTimeSeconds: (seconds) => set({ targetTimeSeconds: seconds }),

      // Flash & Type configuration
      flashChunkSize: DEFAULT_FLASH_CHUNK_SIZE,
      flashDurationMs: DEFAULT_FLASH_DURATION_MS,
      flashTotalRounds: DEFAULT_FLASH_TOTAL_ROUNDS,
      setFlashChunkSize: (size) => set({ flashChunkSize: size }),
      setFlashDurationMs: (ms) => set({ flashDurationMs: ms }),
      setFlashTotalRounds: (rounds) => set({ flashTotalRounds: rounds }),

      // History
      history: [],
      recordTestResult: (result) =>
        set((state) => ({
          history: [result, ...state.history].slice(0, 100), // keep latest 100
        })),

      clearHistory: () => set({ history: [] }),

      resetWordRecords: () =>
        set({
          wordRecords: {},
          globalAverageLatencyMs: 320,
          totalWordsTyped: 0,
        }),

      // Update word stats according to Spaced Repetition rules
      updateWordResult: (word, hasError, latencyMs) => {
        const state = get();
        const prevRecord = state.wordRecords[word];
        const userAvg = state.globalAverageLatencyMs;

        // Current debt count for 50-word cap
        const currentDebtCount = Object.values(state.wordRecords).filter(
          (w) => w.weight >= WEAK_WORD_THRESHOLD,
        ).length;

        const { record, weightDelta } = calculateUpdatedWordRecord(
          prevRecord,
          word,
          hasError,
          latencyMs,
          userAvg,
          currentDebtCount,
        );

        // Update user's global average latency using moving average
        const newTotalTyped = state.totalWordsTyped + 1;
        const newGlobalAvg =
          state.globalAverageLatencyMs === 0
            ? latencyMs
            : Math.round(
                state.globalAverageLatencyMs * 0.92 + latencyMs * 0.08,
              );

        set((s) => ({
          wordRecords: {
            ...s.wordRecords,
            [word]: record,
          },
          globalAverageLatencyMs: newGlobalAvg,
          totalWordsTyped: newTotalTyped,
        }));

        return { record, weightDelta };
      },

      getSpacedWords: (count, prioritizeWeakOnly = false) => {
        const { dictionary, wordRecords, targetWordCount, handMode } = get();
        return generateSpacedRepetitionWords(
          dictionary,
          wordRecords,
          count || targetWordCount,
          handMode,
          prioritizeWeakOnly,
        );
      },

      getFlashChunk: (chunkSize) => {
        const { dictionary, flashChunkSize, handMode } = get();
        return generateFlashChunkWords(
          dictionary,
          chunkSize || flashChunkSize,
          handMode,
        );
      },

      // Single letter learning state & operations
      letterRecords: {},
      targetLetterCount: DEFAULT_TARGET_LETTERS,
      setTargetLetterCount: (count) => set({ targetLetterCount: count }),
      resetLetterRecords: () => set({ letterRecords: {} }),

      updateLetterResult: (letter, hasError, latencyMs) => {
        const state = get();
        const prev = state.letterRecords[letter];
        const userAvg = state.globalAverageLatencyMs;
        const { record, weightDelta } = calculateUpdatedLetterRecord(
          prev,
          letter,
          hasError,
          latencyMs,
          userAvg,
        );
        set((s) => ({
          letterRecords: {
            ...s.letterRecords,
            [letter]: record,
          },
        }));
        return { record, weightDelta };
      },

      getSingleLetters: (count) => {
        const { letterRecords, targetLetterCount, handMode } = get();
        return generateSingleLetters(
          letterRecords,
          count || targetLetterCount,
          handMode,
        );
      },
    }),
    {
      name: "solotype-v1",
      storage: createJSONStorage(() => localStorage),
      // Partialize state so we only persist necessary data
      partialize: (state) => ({
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        soundProfile: state.soundProfile,
        caretStyle: state.caretStyle,
        fontSize: state.fontSize,
        mode: state.mode,
        handMode: state.handMode,
        testType: state.testType,
        targetWordCount: state.targetWordCount,
        targetLetterCount: state.targetLetterCount,
        targetTimeSeconds: state.targetTimeSeconds,
        flashChunkSize: state.flashChunkSize,
        flashDurationMs: state.flashDurationMs,
        flashTotalRounds: state.flashTotalRounds,
        dictionary: state.dictionary,
        wordRecords: state.wordRecords,
        letterRecords: state.letterRecords,
        globalAverageLatencyMs: state.globalAverageLatencyMs,
        totalWordsTyped: state.totalWordsTyped,
        history: state.history,
      }),
    },
  ),
);

/**
 * Hook to avoid hydration mismatch with localStorage in Next.js App Router
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
