import {
  ALL_LETTERS,
  BASE_WORD_WEIGHT,
  CURATED_LEFT_HAND_WORDS,
  CURATED_RIGHT_HAND_WORDS,
  DEFAULT_FLASH_CHUNK_SIZE,
  isLeftHandOnly,
  isRightHandOnly,
  LEFT_HAND_LETTERS,
  MAX_WEAK_WORDS_DEBT,
  REQUIRED_CONSECUTIVE_FAST_STREAK,
  RIGHT_HAND_LETTERS,
  WEAK_WORD_THRESHOLD,
} from "./constants";
import type { HandMode, LetterRecord, WordRecord } from "./types";

/**
 * Calculates updated stats and weight for a word.
 * - If mistyped: consecutive streak resets, weight increases significantly (+1.5 and multiplier).
 * - If latency > user average: consecutive streak resets, weight increases moderately (+0.6).
 * - If typed correctly AND fast (latency <= user average):
 *     streak increments. If streak >= 3, weight decays by ~35%.
 * - Debt constraint: if active debt >= MAX_WEAK_WORDS_DEBT (50), non-debt words cannot inflate debt past 50.
 */
export function calculateUpdatedWordRecord(
  prevRecord: WordRecord | undefined,
  word: string,
  hasError: boolean,
  latencyMs: number,
  userAverageLatencyMs: number,
  currentDebtCount = 0,
): { record: WordRecord; weightDelta: number } {
  const record: WordRecord = prevRecord
    ? { ...prevRecord }
    : {
        word,
        totalAttempts: 0,
        successAttempts: 0,
        lastLatencyMs: 0,
        averageLatencyMs: 0,
        consecutiveFastStreak: 0,
        weight: BASE_WORD_WEIGHT,
        lastPracticedAt: Date.now(),
        errorCount: 0,
      };

  const oldWeight = record.weight;
  const wasAlreadyWeak = oldWeight >= WEAK_WORD_THRESHOLD;
  record.totalAttempts += 1;
  record.lastLatencyMs = latencyMs;
  record.lastPracticedAt = Date.now();

  // Exponential moving average for this word's latency
  record.averageLatencyMs =
    record.averageLatencyMs === 0
      ? latencyMs
      : Math.round(record.averageLatencyMs * 0.65 + latencyMs * 0.35);

  const isSlow = userAverageLatencyMs > 0 && latencyMs > userAverageLatencyMs;

  if (hasError) {
    // 1. Made mistake: sharp weight increase & streak reset
    record.errorCount += 1;
    record.consecutiveFastStreak = 0;

    let targetWeight = Math.min(10.0, record.weight * 1.4 + 1.2);
    // If debt is capped at 50, do not let new words enter the debt list:
    if (!wasAlreadyWeak && currentDebtCount >= MAX_WEAK_WORDS_DEBT) {
      targetWeight = Math.min(targetWeight, WEAK_WORD_THRESHOLD - 0.01);
    }
    record.weight = Number(targetWeight.toFixed(2));
  } else if (isSlow) {
    // 2. Correct but slower than user average: moderate weight increase & streak reset
    record.successAttempts += 1;
    record.consecutiveFastStreak = 0;

    let targetWeight = Math.min(10.0, record.weight + 0.6);
    if (!wasAlreadyWeak && currentDebtCount >= MAX_WEAK_WORDS_DEBT) {
      targetWeight = Math.min(targetWeight, WEAK_WORD_THRESHOLD - 0.01);
    }
    record.weight = Number(targetWeight.toFixed(2));
  } else {
    // 3. Clean and fast!
    record.successAttempts += 1;
    record.consecutiveFastStreak += 1;

    // If user typed correctly and quickly 3 times in a row, decay weight
    if (record.consecutiveFastStreak >= REQUIRED_CONSECUTIVE_FAST_STREAK) {
      const newWeight = Math.max(0.4, record.weight * 0.65);
      record.weight = Number(newWeight.toFixed(2));
    }
  }

  const weightDelta = Number((record.weight - oldWeight).toFixed(2));
  return { record, weightDelta };
}

/**
 * Filters a vocabulary dictionary according to the chosen hand mode:
 * - "both": whole dictionary
 * - "left": strictly left hand QWERTY characters
 * - "right": strictly right hand QWERTY characters
 */
export function filterDictionaryByHand(
  dictionary: string[],
  handMode: HandMode,
): string[] {
  if (handMode === "left") {
    const matching = dictionary.filter(isLeftHandOnly);
    const set = new Set([...matching, ...CURATED_LEFT_HAND_WORDS]);
    return Array.from(set);
  }
  if (handMode === "right") {
    const matching = dictionary.filter(isRightHandOnly);
    const set = new Set([...matching, ...CURATED_RIGHT_HAND_WORDS]);
    return Array.from(set);
  }
  return dictionary;
}

/**
 * Fisher-Yates array shuffle.
 */
export function shuffleArray<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * Generates a session of words for Spaced Repetition typing:
 * - Respects Hand Mode (both, left, or right hand only).
 * - Automatically injects weak words into normal practice sessions.
 * - Debt constraint: if debt >= 50, enforces Debt Resolution Mode (100% weak words until cleared).
 */
export function generateSpacedRepetitionWords(
  rawDictionary: string[],
  wordRecords: Record<string, WordRecord>,
  targetCount: number,
  handMode: HandMode = "both",
  prioritizeWeakOnly = false,
): string[] {
  const dictionary = filterDictionaryByHand(rawDictionary, handMode);
  if (!dictionary || dictionary.length === 0) {
    return [];
  }

  // Count active debt across all words
  const allWeakRecords = Object.values(wordRecords).filter(
    (rec) => rec.weight >= WEAK_WORD_THRESHOLD,
  );
  const totalDebtCount = allWeakRecords.length;
  const isDebtLocked = totalDebtCount >= MAX_WEAK_WORDS_DEBT;

  // Identify weak/unmastered words matching current handMode
  const weakWords: { word: string; weight: number }[] = [];
  for (const [word, rec] of Object.entries(wordRecords)) {
    if (rec.weight >= WEAK_WORD_THRESHOLD) {
      if (handMode === "left" && !isLeftHandOnly(word)) continue;
      if (handMode === "right" && !isRightHandOnly(word)) continue;
      weakWords.push({ word, weight: rec.weight });
    }
  }

  // Sort descending by weight (hardest words first)
  weakWords.sort((a, b) => b.weight - a.weight);

  // If debt is locked (>= 50) OR user requested prioritizeWeakOnly:
  // We MUST solve debt first! Feed 100% weak words.
  if ((isDebtLocked || prioritizeWeakOnly) && weakWords.length > 0) {
    const selectedWeak: string[] = [];
    while (selectedWeak.length < targetCount) {
      for (const w of weakWords) {
        if (selectedWeak.length >= targetCount) break;
        selectedWeak.push(w.word);
      }
    }
    return shuffleArray(selectedWeak);
  }

  // Standard Spaced Repetition Mode:
  // Auto-inject ~45% weak words if available
  if (weakWords.length > 0) {
    const weakQuota = Math.min(Math.ceil(targetCount * 0.45), weakWords.length);

    // Weighted selection for weak quota: top weighted words get prioritized
    const chosenWeak: string[] = [];
    const pool = [...weakWords];

    while (chosenWeak.length < weakQuota && pool.length > 0) {
      const index = Math.floor(Math.random() ** 2 * pool.length);
      const [picked] = pool.splice(index, 1);
      if (picked) {
        chosenWeak.push(picked.word);
      }
    }

    const randomQuota = targetCount - chosenWeak.length;
    const chosenRandom = pickRandomUniqueWords(
      dictionary,
      randomQuota,
      chosenWeak,
    );

    return shuffleArray([...chosenWeak, ...chosenRandom]);
  }

  // If no weak words recorded yet, pick purely random words from hand-filtered dictionary
  return pickRandomWords(dictionary, targetCount);
}

/**
 * Generates a small chunk of words (3-5) for Flash & Type mode.
 */
export function generateFlashChunkWords(
  rawDictionary: string[],
  chunkSize = DEFAULT_FLASH_CHUNK_SIZE,
  handMode: HandMode = "both",
): string[] {
  const dictionary = filterDictionaryByHand(rawDictionary, handMode);
  if (!dictionary || dictionary.length === 0) return [];
  return pickRandomWords(dictionary, Math.max(2, Math.min(6, chunkSize)));
}

function pickRandomWords(dictionary: string[], count: number): string[] {
  const result: string[] = [];
  const len = dictionary.length;
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * len);
    result.push(dictionary[randomIndex]);
  }
  return result;
}

function pickRandomUniqueWords(
  dictionary: string[],
  count: number,
  exclude: string[],
): string[] {
  const excludeSet = new Set(exclude);
  const candidates = dictionary.filter((w) => !excludeSet.has(w));
  if (candidates.length < count) {
    return pickRandomWords(dictionary, count);
  }
  return shuffleArray(candidates).slice(0, count);
}

/**
 * Calculates updated stats and weight for an individual letter:
 * - If mistyped: error count + 1, weight increases significantly, consecutive streak resets.
 * - If latency > user average: weight increases moderately (+0.4), streak resets.
 * - If correct & fast (3 in a row): weight decays by 30%.
 */
export function calculateUpdatedLetterRecord(
  prevRecord: LetterRecord | undefined,
  letter: string,
  hasError: boolean,
  latencyMs: number,
  userAverageLatencyMs: number,
): { record: LetterRecord; weightDelta: number } {
  const record: LetterRecord = prevRecord
    ? { ...prevRecord }
    : {
        letter,
        totalAttempts: 0,
        successAttempts: 0,
        errorCount: 0,
        lastLatencyMs: 0,
        averageLatencyMs: 0,
        consecutiveFastStreak: 0,
        weight: 1.0,
        lastPracticedAt: Date.now(),
      };

  const oldWeight = record.weight;
  record.totalAttempts += 1;
  record.lastLatencyMs = latencyMs;
  record.lastPracticedAt = Date.now();

  record.averageLatencyMs =
    record.averageLatencyMs === 0
      ? latencyMs
      : Math.round(record.averageLatencyMs * 0.7 + latencyMs * 0.3);

  const isSlow = userAverageLatencyMs > 0 && latencyMs > userAverageLatencyMs;

  if (hasError) {
    record.errorCount += 1;
    record.consecutiveFastStreak = 0;
    const newWeight = Math.min(10.0, record.weight * 1.5 + 1.0);
    record.weight = Number(newWeight.toFixed(2));
  } else if (isSlow) {
    record.successAttempts += 1;
    record.consecutiveFastStreak = 0;
    const newWeight = Math.min(10.0, record.weight + 0.4);
    record.weight = Number(newWeight.toFixed(2));
  } else {
    record.successAttempts += 1;
    record.consecutiveFastStreak += 1;
    if (record.consecutiveFastStreak >= 3) {
      const newWeight = Math.max(0.4, record.weight * 0.7);
      record.weight = Number(newWeight.toFixed(2));
    }
  }

  const weightDelta = Number((record.weight - oldWeight).toFixed(2));
  return { record, weightDelta };
}

/**
 * Generates a session of single letters for Character Spaced Repetition:
 * - HandMode:
 *     - "left": strictly left hand QWERTY keys ('qwertasdfgzxcvb')
 *     - "right": strictly right hand QWERTY keys ('yuiophjklnm')
 *     - "both": full alphabet ('a' - 'z')
 * - Spaced Repetition weighting:
 *     - Letters with higher weight (frequent errors or slow latency) have higher selection probability.
 *     - Avoids repeating the exact same letter more than once in a row for good typing rhythm.
 */
export function generateSingleLetters(
  letterRecords: Record<string, LetterRecord>,
  targetCount: number,
  handMode: HandMode = "both",
): string[] {
  let pool = ALL_LETTERS;
  if (handMode === "left") pool = LEFT_HAND_LETTERS;
  if (handMode === "right") pool = RIGHT_HAND_LETTERS;

  if (pool.length === 0) return [];

  // Calculate weights for each letter in pool
  const weights = pool.map((char) => {
    const rec = letterRecords[char];
    return rec ? Math.max(0.3, rec.weight) : 1.0;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const result: string[] = [];
  let prevPicked = "";

  for (let i = 0; i < targetCount; i++) {
    let picked = pool[0];
    let attempts = 0;
    while (attempts < 5) {
      const rand = Math.random() * totalWeight;
      let cumulative = 0;
      for (let j = 0; j < pool.length; j++) {
        cumulative += weights[j];
        if (rand <= cumulative) {
          picked = pool[j];
          break;
        }
      }
      if (picked !== prevPicked || pool.length <= 1) {
        break;
      }
      attempts++;
    }

    result.push(picked);
    prevPicked = picked;
  }

  return result;
}
