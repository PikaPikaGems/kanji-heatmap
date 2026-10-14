import type { Kanji, ReviewPileItemView } from "engine-contract";
import { getCachedStore, REVIEW_PILE_ALL_KEY } from "./store-cache";
import { useEngineApi, useEngineQuery } from "./use-engine-query";

/**
 * - `loading`: the engine or the store hasn't answered yet.
 * - `failed`: the engine answered with an error. `retry` re-reads the store
 *   when the error says a retry can help, else it is null.
 * - `unavailable`: the pile can't be read at all (no engine in this build or
 *   browser).
 * `byKanji` is empty unless `ready`.
 */
type PileByKanji = ReadonlyMap<Kanji, ReviewPileItemView>;

export type ReviewPileSnapshot =
  | { status: "loading" | "ready" | "unavailable"; byKanji: PileByKanji }
  | {
      status: "failed";
      byKanji: PileByKanji;
      retry: (() => void) | null;
    };

const EMPTY: PileByKanji = new Map();
const LOADING: ReviewPileSnapshot = { status: "loading", byKanji: EMPTY };
const UNAVAILABLE: ReviewPileSnapshot = {
  status: "unavailable",
  byKanji: EMPTY,
};

// Keyed by the store's snapshot value, which is stable between updates: the
// same Map comes back every render (anything derived from it can key on its
// identity), without useMemo.
const readyByValue = new WeakMap<object, ReviewPileSnapshot>();

/**
 * Every review-pile row by kanji (`reviews.pile.watchAll()`, the same cached
 * store `useReviewingKanji` reads; about 2,400 rows, so list UIs must
 * virtualize and memoize their items).
 */
export const useReviewPileByKanji = (): ReviewPileSnapshot => {
  const api = useEngineApi();
  const snapshot = useEngineQuery(REVIEW_PILE_ALL_KEY, (a) =>
    a.reviews.pile.watchAll()
  );

  if (snapshot.status === "loading") return LOADING;
  if (snapshot.status === "unavailable") return UNAVAILABLE;
  if (snapshot.status === "failed") {
    return {
      status: "failed",
      byKanji: EMPTY,
      retry:
        snapshot.retryable && api
          ? () =>
              void getCachedStore(api, REVIEW_PILE_ALL_KEY, (a) =>
                a.reviews.pile.watchAll()
              ).refresh()
          : null,
    };
  }
  if (!snapshot.result.ok) {
    return { status: "failed", byKanji: EMPTY, retry: null };
  }

  const value = snapshot.result.value;
  const cached = readyByValue.get(value);
  if (cached) return cached;
  const next: ReviewPileSnapshot = {
    status: "ready",
    byKanji: new Map(value.map((item) => [item.kanji, item])),
  };
  readyByValue.set(value, next);
  return next;
};
