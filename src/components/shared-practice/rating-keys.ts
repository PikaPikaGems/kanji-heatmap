import type { FsrsRating } from "engine-contract";

export type PassingRating = Exclude<FsrsRating, "again">;

// Letters from the button labels: H Hard, G Good, E Easy; Enter is Good.
// Looked up in lowercase; the key lists below carry both cases so the
// shortcuts work with Caps Lock too.
const RATING_FOR_KEY: Readonly<Record<string, PassingRating>> = {
  h: "hard",
  g: "good",
  e: "easy",
  enter: "good",
};

/**
 * Forgot grades Again; its key works while the Forgot button is enabled, on
 * every rating screen. "?" (Shift on most layouts) and the full-width "？" a
 * Japanese IME types. No reading contains either, so it works from the
 * reading answer box too.
 */
export const FORGOT_KEYS = ["?", "？"] as const;

/** The Forgot key as the button's hint ("Forgot · ?"). */
export const FORGOT_HINT = "?";

/** Keys that rate while the buttons show (callers add their own "Next" keys). */
export const RATING_KEYS = ["h", "H", "g", "G", "e", "E", "Enter"] as const;

/** H = Hard, G = Good, E = Easy, Enter = Good; null for any other key. */
export const ratingForKey = (key: string): PassingRating | null =>
  RATING_FOR_KEY[key.toLowerCase()] ?? null;

type KeyEventLike = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

/** Ctrl / Cmd / Alt + a printable key is a browser shortcut, never a grade. */
const isShortcutCombo = (e: KeyEventLike) =>
  e.key !== "Enter" && (e.ctrlKey || e.metaKey || e.altKey);

/**
 * `ratingForKey` for a keydown event: the letters ignore Ctrl / Cmd / Alt
 * combos (Cmd+E, Ctrl+G ...) so browser shortcuts never grade a card.
 */
export const ratingForKeyEvent = (e: KeyEventLike): PassingRating | null =>
  isShortcutCombo(e) ? null : ratingForKey(e.key);

/** True for the Forgot key ("?" / "？"), with Shift allowed but not Ctrl / Cmd / Alt. */
export const isForgotKeyEvent = (e: KeyEventLike): boolean =>
  !isShortcutCombo(e) && (FORGOT_KEYS as readonly string[]).includes(e.key);

/** True when typed text holds the Forgot key (soft keyboards, IME commits). */
export const hasForgotKey = (text: string): boolean =>
  FORGOT_KEYS.some((key) => text.includes(key));
