import type { FsrsRating } from "engine-contract";

export type PassingRating = Exclude<FsrsRating, "again">;

// Anki-style: 1 Again (Forgot), 2 Hard, 3 Good, 4 Easy; Enter is Good.
const RATING_FOR_KEY: Readonly<Record<string, PassingRating>> = {
  "2": "hard",
  "3": "good",
  "4": "easy",
  Enter: "good",
};

/** Forgot grades Again; its key works while the Forgot button is enabled. */
export const FORGOT_KEY = "1";
export const FORGOT_KEYS = [FORGOT_KEY] as const;

/** Keys that rate while the buttons show (callers add their own "Next" keys). */
export const RATING_KEYS = ["2", "3", "4", "Enter"] as const;

/** Every digit shortcut; no reading or word ever contains one. */
export const GRADE_DIGIT_KEYS: readonly string[] = ["1", "2", "3", "4"];

/** 2 = Hard, 3 = Good, 4 = Easy, Enter = Good; null for any other key. */
export const ratingForKey = (key: string): PassingRating | null =>
  RATING_FOR_KEY[key] ?? null;
