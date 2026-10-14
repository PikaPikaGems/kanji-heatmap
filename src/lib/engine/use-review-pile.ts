import type { Kanji, ReviewPileItemView } from "engine-contract";
import { REVIEW_PILE_ALL_KEY } from "./store-cache";
import { useEngineQuery } from "./use-engine-query";

/**
 * - `loading`: the engine or the store hasn't answered yet.
 * - `unavailable`: the pile can't be read right now (signed out, old browser,
 *   recovery, no engine in this build). `byKanji` is empty.
 */
export type ReviewPileSnapshot = {
  status: "loading" | "ready" | "unavailable";
  byKanji: ReadonlyMap<Kanji, ReviewPileItemView>;
};

const EMPTY: ReadonlyMap<Kanji, ReviewPileItemView> = new Map();
const LOADING: ReviewPileSnapshot = { status: "loading", byKanji: EMPTY };
const UNAVAILABLE: ReviewPileSnapshot = {
  status: "unavailable",
  byKanji: EMPTY,
};

// Keyed by the store's snapshot value, which is stable between updates: the
// same Map comes back every render (anything derived from it can key on its
// identity), without useMemo.
const snapshotsByValue = new WeakMap<object, ReviewPileSnapshot>();

/**
 * Every review-pile row by kanji (`reviews.pile.watchAll()`, the same cached
 * store `useReviewingKanji` reads; about 2,400 rows, so list UIs must
 * virtualize and memoize their items).
 */
export const useReviewPileByKanji = (): ReviewPileSnapshot => {
  const snapshot = useEngineQuery(REVIEW_PILE_ALL_KEY, (api) =>
    api.reviews.pile.watchAll()
  );

  if (snapshot.status === "loading") return LOADING;
  if (snapshot.status !== "ready" || !snapshot.result.ok) return UNAVAILABLE;

  const value = snapshot.result.value;
  const cached = snapshotsByValue.get(value);
  if (cached) return cached;
  const next: ReviewPileSnapshot = {
    status: "ready",
    byKanji: new Map(value.map((item) => [item.kanji, item])),
  };
  snapshotsByValue.set(value, next);
  return next;
};
