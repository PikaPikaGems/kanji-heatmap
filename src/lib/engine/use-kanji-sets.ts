import type { EngineAPI, Kanji, QueryStore } from "engine-contract";
import { isEngineAbsent } from "./account-ui";
import { useEngineState } from "./engine";
import { BOOKMARKS_ALL_KEY, REVIEW_PILE_ALL_KEY } from "./store-cache";
import { useEngineQuery } from "./use-engine-query";

/**
 * - `loading`: the engine or the store hasn't answered yet.
 * - `unavailable`: the set can't be read right now (signed out, old browser,
 *   recovery). `kanji` is empty.
 * - `absent`: this build has no study engine, so the feature doesn't exist.
 *   Filters built on the set should be ignored, not applied against nothing.
 */
export type KanjiSetSnapshot = {
  status: "loading" | "ready" | "unavailable" | "absent";
  kanji: ReadonlySet<Kanji>;
};

const EMPTY: ReadonlySet<Kanji> = new Set();
const LOADING: KanjiSetSnapshot = { status: "loading", kanji: EMPTY };
const UNAVAILABLE: KanjiSetSnapshot = { status: "unavailable", kanji: EMPTY };
const ABSENT: KanjiSetSnapshot = { status: "absent", kanji: EMPTY };

// Keyed by the store's snapshot value, which is stable between updates: the
// same Set comes back every render (filtered lists depend on its identity),
// without useMemo.
const setsByValue = new WeakMap<object, KanjiSetSnapshot>();

const useKanjiSet = <T extends object>(
  key: string,
  create: (api: EngineAPI) => QueryStore<T>,
  toKanji: (value: T) => Iterable<Kanji>
): KanjiSetSnapshot => {
  const engine = useEngineState();
  const snapshot = useEngineQuery(key, create);

  if (engine.status === "unavailable" && isEngineAbsent(engine.reason)) {
    return ABSENT;
  }
  if (snapshot.status === "loading") return LOADING;
  if (snapshot.status !== "ready" || !snapshot.result.ok) return UNAVAILABLE;

  const value = snapshot.result.value;
  const cached = setsByValue.get(value);
  if (cached) return cached;
  const next: KanjiSetSnapshot = {
    status: "ready",
    kanji: new Set(toKanji(value)),
  };
  setsByValue.set(value, next);
  return next;
};

/** Every bookmarked kanji (`bookmarks.watchAll()`, one cached store). */
export const useBookmarkedKanji = (): KanjiSetSnapshot =>
  useKanjiSet(
    BOOKMARKS_ALL_KEY,
    (api) => api.bookmarks.watchAll(),
    (kanji) => kanji
  );

/** Every kanji that has a review-pile item (`reviews.pile.watchAll()`). */
export const useReviewingKanji = (): KanjiSetSnapshot =>
  useKanjiSet(
    REVIEW_PILE_ALL_KEY,
    (api) => api.reviews.pile.watchAll(),
    (items) => items.map((item) => item.kanji)
  );
