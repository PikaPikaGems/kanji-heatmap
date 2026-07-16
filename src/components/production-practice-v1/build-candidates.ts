import { isKanji, shuffle } from "@/lib/utils";
import { CANDIDATE_COUNT } from "./constants";

/**
 * Build a 12-kanji look-alike grid (always 4×3).
 * Always shuffled so a top-model hit is not always in the first cell.
 *
 * Fill order before shuffle:
 *   1. target (always)
 *   2. seed — model guesses if in top 10, else database similars
 *   3. secondary — the other of those two
 *   4. related — similars of the model guesses / similars (lookalike neighbors)
 *   5. random deck — last resort only
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
  getSimilars,
  isRealKanji = defaultIsRealKanji,
}: {
  target: string;
  inTop10: boolean;
  modelGuesses: string[];
  similars: string[];
  randomPool: string[];
  /** Similars lookup used to expand lookalikes of model/similar seeds. */
  getSimilars?: (k: string) => string[];
  /** Override for “in our kanji database” checks (recommended). */
  isRealKanji?: (k: string) => boolean;
}): string[] => {
  const related = expandRelated(
    [target, ...modelGuesses, ...similars],
    getSimilars
  );

  if (inTop10) {
    return padCandidates(
      modelGuesses,
      target,
      similars,
      related,
      randomPool,
      isRealKanji
    );
  }

  return padCandidates(
    similars,
    target,
    modelGuesses,
    related,
    randomPool,
    isRealKanji
  );
};

/** Unicode CJK only — drops kana; pass `isRealKanji` from kanji_main for radicals. */
const defaultIsRealKanji = (k: string) => k.length === 1 && isKanji(k);

const expandRelated = (
  seeds: string[],
  getSimilars?: (k: string) => string[]
): string[] => {
  if (!getSimilars) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const seed of seeds) {
    if (!seed || seen.has(seed)) continue;
    seen.add(seed);
    for (const s of getSimilars(seed)) {
      if (!s || seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
  }
  return out;
};

const padCandidates = (
  seed: string[],
  target: string,
  secondary: string[],
  related: string[],
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
  for (const k of related) push(k);
  for (const k of filler) push(k);

  return shuffle(out);
};
