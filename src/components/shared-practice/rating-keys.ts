import type { FsrsRating } from "engine-contract";

export type PassingRating = Exclude<FsrsRating, "again">;

// Letters from the button labels: F Forgot, H Hard, G Good, E Easy; Enter is
// Good. Looked up in lowercase; the key lists below carry both cases so the
// shortcuts work with Caps Lock too.
const RATING_FOR_KEY: Readonly<Record<string, PassingRating>> = {
  h: "hard",
  g: "good",
  e: "easy",
  enter: "good",
};

/**
 * Forgot grades Again; its key works while the Forgot button is enabled. Not
 * used where a text field has focus (reading games), since F is typed there.
 */
export const FORGOT_KEYS = ["f", "F"] as const;

/** Keys that rate while the buttons show (callers add their own "Next" keys). */
export const RATING_KEYS = ["h", "H", "g", "G", "e", "E", "Enter"] as const;

/** H = Hard, G = Good, E = Easy, Enter = Good; null for any other key. */
export const ratingForKey = (key: string): PassingRating | null =>
  RATING_FOR_KEY[key.toLowerCase()] ?? null;

/**
 * `ratingForKey` for a keydown event: the letters ignore Ctrl / Cmd / Alt
 * combos (Cmd+E, Ctrl+G ...) so browser shortcuts never grade a card.
 */
export const ratingForKeyEvent = (e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}): PassingRating | null =>
  e.key !== "Enter" && (e.ctrlKey || e.metaKey || e.altKey)
    ? null
    : ratingForKey(e.key);
