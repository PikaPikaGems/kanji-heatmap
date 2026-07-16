import { shuffle } from "@/lib/utils";
import { CANDIDATE_COUNT } from "./constants";

/**
 * Build a 10-kanji look-alike grid.
 * Always shuffled so a top-model hit is not always in the first cell.
 * Fill order before shuffle: target → similars / model guesses → random pool.
 */
export const buildCandidateGrid = ({
  target,
  inTop10,
  modelGuesses,
  similars,
  randomPool,
}: {
  target: string;
  inTop10: boolean;
  modelGuesses: string[];
  similars: string[];
  randomPool: string[];
}): string[] => {
  if (inTop10) {
    return padCandidates(
      modelGuesses.slice(0, CANDIDATE_COUNT),
      target,
      [],
      randomPool
    );
  }

  return padCandidates([], target, similars, [...modelGuesses, ...randomPool]);
};

const padCandidates = (
  seed: string[],
  target: string,
  similars: string[],
  filler: string[]
): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (k: string) => {
    if (!k || seen.has(k) || out.length >= CANDIDATE_COUNT) return;
    seen.add(k);
    out.push(k);
  };

  push(target);
  for (const k of seed) push(k);
  for (const k of similars) push(k);
  for (const k of filler) push(k);

  return shuffle(out);
};
