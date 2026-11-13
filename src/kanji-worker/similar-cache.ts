import KANJI_WORKER_SINGLETON from "./kanji-worker-promise-wrapper";

/**
 * Similar kanji received from the worker so far, by kanji. Kept for the whole
 * visit, so a retry or the next batch asks the worker for none of them again.
 */
const cache = new Map<string, string[]>();

const similarsOf = (kanji: string) => cache.get(kanji) ?? [];

/** These kanji and, one level further, their similars' similars. */
const withSecondDegree = (kanji: string[]) => [
  ...new Set([...kanji, ...kanji.flatMap(similarsOf)]),
];

const allCached = (kanji: string[]) => kanji.every((k) => cache.has(k));

/** Asks the worker for the kanji not cached yet (only those, not the whole map). */
const fetchMissing = async (kanji: string[]) => {
  const missing = kanji.filter((k) => !cache.has(k));
  if (missing.length === 0) return;
  const found = await KANJI_WORKER_SINGLETON.request({
    type: "similar-for-kanji",
    payload: missing,
  });
  for (const k of missing) cache.set(k, found[k] ?? []);
};

/** A lookup for these kanji's similars (two levels deep), or null until cached. */
export const peekSimilarLookup = (
  kanji: string[]
): ((k: string) => string[]) | null =>
  allCached(kanji) && allCached(withSecondDegree(kanji)) ? similarsOf : null;

/**
 * Loads the similars of these kanji and of their similars (the tiles use two
 * levels), then returns the lookup.
 */
export const loadSimilarLookup = async (
  kanji: string[]
): Promise<(k: string) => string[]> => {
  await fetchMissing(kanji);
  await fetchMissing(withSecondDegree(kanji));
  return similarsOf;
};
