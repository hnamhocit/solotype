/**
 * Typing & FlashMode Scoring Engine
 * Computes Levenshtein edit distance, word token alignment, and industry-standard WPM & Accuracy.
 */

export function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return dp[a.length][b.length];
}

export interface AlignedWordPair {
  target: string | null;
  typed: string | null;
  isMatch: boolean;
  correctChars: number;
}

/**
 * Aligns target words and typed words using sequence similarity.
 * Prevents a single missing or extra word from shifting subsequent words.
 */
export function alignFlashWords(
  targetWords: string[],
  typedWords: string[],
): AlignedWordPair[] {
  const n = targetWords.length;
  const m = typedWords.length;

  const simMatrix: number[][] = Array.from({ length: n }, () =>
    Array(m).fill(0),
  );

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const w1 = targetWords[i];
      const w2 = typedWords[j];
      if (w1 === w2) {
        simMatrix[i][j] = 1.0;
      } else {
        const maxL = Math.max(w1.length, w2.length);
        const dist = levenshteinDistance(w1, w2);
        simMatrix[i][j] = Math.max(0, (maxL - dist) / maxL);
      }
    }
  }

  // DP alignment
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sim = simMatrix[i - 1][j - 1];
      const matchScore = sim >= 0.25 ? sim * 2 : -0.4;
      dp[i][j] = Math.max(
        dp[i - 1][j - 1] + matchScore,
        dp[i - 1][j] - 0.2,
        dp[i][j - 1] - 0.2,
      );
    }
  }

  // Backtracking
  let i = n;
  let j = m;
  const pairs: { target: string | null; typed: string | null }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const sim = simMatrix[i - 1][j - 1];
      const matchScore = sim >= 0.25 ? sim * 2 : -0.4;
      if (Math.abs(dp[i][j] - (dp[i - 1][j - 1] + matchScore)) < 1e-5) {
        pairs.unshift({
          target: targetWords[i - 1],
          typed: typedWords[j - 1],
        });
        i--;
        j--;
        continue;
      }
    }

    if (
      i > 0 &&
      (j === 0 || Math.abs(dp[i][j] - (dp[i - 1][j] - 0.2)) < 1e-5)
    ) {
      pairs.unshift({ target: targetWords[i - 1], typed: null });
      i--;
    } else {
      pairs.unshift({ target: null, typed: typedWords[j - 1] });
      j--;
    }
  }

  return pairs.map(({ target, typed }) => {
    if (!target) {
      return { target, typed, isMatch: false, correctChars: 0 };
    }
    if (!typed) {
      return { target, typed, isMatch: false, correctChars: 0 };
    }
    if (target === typed) {
      return { target, typed, isMatch: true, correctChars: target.length };
    }
    const dist = levenshteinDistance(target, typed);
    const correctChars = Math.max(0, target.length - dist);
    return { target, typed, isMatch: false, correctChars };
  });
}

export interface FlashScoreResult {
  accuracy: number;
  wpm: number;
  rawWpm: number;
  correctChars: number;
  totalTargetChars: number;
  alignment: AlignedWordPair[];
  isFlawless: boolean;
}

/**
 * Standard accuracy and WPM calculation for Flash & Type chunks.
 */
export function calculateFlashScore(
  targetWords: string[],
  typedWords: string[],
  durationMs: number,
): FlashScoreResult {
  const alignment = alignFlashWords(targetWords, typedWords);
  const totalTargetChars = targetWords.join(" ").length;
  const totalTypedChars = typedWords.join(" ").length;

  let correctChars = 0;
  let previousMatched = false;

  for (const pair of alignment) {
    if (pair.target && pair.typed) {
      correctChars += pair.correctChars;
      // Add space if both this word and previous were non-empty
      if (previousMatched) {
        correctChars += 1;
      }
      previousMatched = pair.correctChars > 0;
    } else {
      previousMatched = false;
    }
  }

  // Cap correct chars to target length
  const finalCorrectChars = Math.min(totalTargetChars, correctChars);
  const accuracy =
    totalTargetChars > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((finalCorrectChars / totalTargetChars) * 100)),
        )
      : 100;

  const minutes = Math.max(0.001, durationMs / 60000);
  const wpm = Math.max(0, Math.round(finalCorrectChars / 5 / minutes));
  const rawWpm = Math.max(0, Math.round(totalTypedChars / 5 / minutes));
  const isFlawless = targetWords.join(" ") === typedWords.join(" ");

  return {
    accuracy: isFlawless ? 100 : accuracy,
    wpm,
    rawWpm,
    correctChars: finalCorrectChars,
    totalTargetChars,
    alignment,
    isFlawless,
  };
}
