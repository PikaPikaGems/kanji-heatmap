import { isKanji, shuffle } from "@/lib/utils";
import { CANDIDATE_COUNT } from "./constants";

/**
 * Build a 12-kanji look-alike grid (always 4×3).
 * Always shuffled so a top-model hit is not always in the first cell.
 * Fill order before shuffle: target → similars / model guesses → random pool.
 *
 * Hard rule: only real kanji — no hiragana, katakana, or radicals-only glyphs.
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
  if (inTop10) {
    return padCandidates(
      modelGuesses.slice(0, CANDIDATE_COUNT),
      target,
      [],
      randomPool,
      isRealKanji
    );
  }

  return padCandidates(
    [],
    target,
    similars,
    [...modelGuesses, ...randomPool],
    isRealKanji
  );
};

/** Unicode CJK only — drops kana; pass `isRealKanji` from the kanji DB for radicals. */
const defaultIsRealKanji = (k: string) => k.length === 1 && isKanji(k);

const padCandidates = (
  seed: string[],
  target: string,
  similars: string[],
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
  for (const k of similars) push(k);
  for (const k of filler) push(k);

  return shuffle(out);
};
