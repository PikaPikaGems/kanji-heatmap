import { isKanji, shuffle } from "@/lib/utils";
import { CANDIDATE_COUNT } from "./constants";

/**
 * Build a 12-kanji look-alike grid (always 4×3).
 * Always shuffled so a top-model hit is not always in the first cell.
 * Fill order before shuffle: target → seed → secondary → filler.
 * Always pads to CANDIDATE_COUNT when the pools have enough unique real kanji.
 *
 * Hard rule: only real kanji — no hiragana, katakana, or radicals-only glyphs.
 * Pass `isRealKanji` that checks kanji_main (e.g. `info?.jlpt != null`), not
 * `getKanjiInfo != null` — that helper also returns radical part-keywords.
 */
export const buildCandidateGrid = ({
  target,
  inTop10,
  modelGuesses,
  similars,
  randomPool,
  isRealKanji = defaultIsRealKanji,
}: {
  target: string;
  inTop10: boolean;
  modelGuesses: string[];
  similars: string[];
  randomPool: string[];
  /** Override for “in our kanji database” checks (recommended). */
  isRealKanji?: (k: string) => boolean;
}): string[] => {
  // Model top-K is 10; after filtering kana/radicals we may be short of 12.
  // Always pad with similars / the other pool, then random deck kanji.
  if (inTop10) {
    return padCandidates(
      modelGuesses,
      target,
      similars,
      randomPool,
      isRealKanji
    );
  }

  return padCandidates(similars, target, modelGuesses, randomPool, isRealKanji);
};

/** Unicode CJK only — drops kana; pass `isRealKanji` from kanji_main for radicals. */
const defaultIsRealKanji = (k: string) => k.length === 1 && isKanji(k);

const padCandidates = (
  seed: string[],
  target: string,
  secondary: string[],
  filler: string[],
  isRealKanji: (k: string) => boolean
): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (k: string, force = false) => {
    if (!k || seen.has(k) || out.length >= CANDIDATE_COUNT) return;
    if (!force && !isRealKanji(k)) return;
    seen.add(k);
    out.push(k);
  };

  push(target, true);
  for (const k of seed) push(k);
  for (const k of secondary) push(k);
  for (const k of filler) push(k);

  return shuffle(out);
};
