import { isKanji, shuffle } from "@/lib/utils";
import {
  CANDIDATE_COUNT,
  MODEL_SEED_COUNT,
  SIMILAR_SEED_COUNT,
} from "./constants";

/**
 * Build a 12-kanji look-alike grid (always 4×3).
 * Always shuffled so a top-model hit is not always in the first cell.
 *
 * Fill order before shuffle:
 *   1. target (always)
 *   2. up to MODEL_SEED_COUNT distinct recognizer top guesses
 *   3. up to SIMILAR_SEED_COUNT distinct database similars of the target
 *   4. overflow of either pool beyond its quota (whichever ran short)
 *   5. related — similars of the model guesses / similars (lookalike neighbors)
 *   6. random deck — last resort only
 *
 * Hard rule: only real kanji — no hiragana, katakana, or radicals-only glyphs.
 * Pass `isRealKanji` that checks kanji_main (e.g. `info?.jlpt != null`), not
 * `getKanjiInfo != null` — that helper also returns radical part-keywords.
 */
export const buildCandidateGrid = ({
  target,
  modelGuesses,
  similars,
  randomPool,
  getSimilars,
  isRealKanji = defaultIsRealKanji,
}: {
  target: string;
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

  return padCandidates(
    modelGuesses,
    similars,
    target,
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
  modelGuesses: string[],
  similars: string[],
  target: string,
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

  // Fills at most `quota` *new* entries from `pool`, in order — duplicates
  // (e.g. the target already sitting at rank 0) don't consume the quota.
  const pushQuota = (pool: string[], quota: number) => {
    let added = 0;
    for (const k of pool) {
      if (added >= quota) break;
      const before = out.length;
      push(k);
      if (out.length > before) added++;
    }
  };

  push(target, true);
  pushQuota(modelGuesses, MODEL_SEED_COUNT);
  pushQuota(similars, SIMILAR_SEED_COUNT);

  // Backfill with whatever quota-limited entries didn't make the cut above
  // (covers the case where one pool ran short of its quota).
  for (const k of modelGuesses) push(k);
  for (const k of similars) push(k);
  for (const k of related) push(k);
  for (const k of filler) push(k);

  return shuffle(out);
};
