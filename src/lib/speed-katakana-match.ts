import { tryConvertRomaji } from "@/lib/wanakana-adapter";

/**
 * Matching rules for the Speed Katakana typing game. All comparisons happen
 * in romaji space so the long-vowel mark ー matches a doubled vowel too
 * (e.g. typing "paasento" → パアセント still clears パーセント).
 */

// iOS autocomplete / the IME suggestion bar appends a trailing space (often
// the full-width U+3000) to the inserted word. Strip all whitespace so a
// correct-but-spaced commit still matches. JS \s already covers U+3000 and
// other Unicode spaces.
export const cleanTypedKana = (typed: string) => typed.replace(/\s+/g, "");

// Ignore a trailing partial romaji tail (e.g. "k" before "ka" → "カ") so
// mid-syllable typing isn't mistaken for an error.
export const stripPartialRomajiTail = (kana: string) =>
  kana.replace(/[a-zA-Z]+$/, "");

/** Is the (possibly mid-syllable) typed kana still a prefix of the target? */
export const isOnTrack = (typed: string, targetKatakana: string) => {
  const committedKana = stripPartialRomajiTail(cleanTypedKana(typed));
  return tryConvertRomaji(targetKatakana).startsWith(
    tryConvertRomaji(committedKana)
  );
};

/** Does the typed kana fully match the target word? */
export const isMatch = (typed: string, targetKatakana: string) =>
  tryConvertRomaji(cleanTypedKana(typed)) === tryConvertRomaji(targetKatakana);
