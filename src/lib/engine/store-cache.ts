import type { EngineAPI, QuerySnapshot, QueryStore } from "engine-contract";

/**
 * Engine `watch*()` calls return a new QueryStore each time. Components need
 * the same store across renders (otherwise useSyncExternalStore resubscribes
 * every render), so stores are cached per engine instance under a string key.
 *
 * Key convention: `"<namespace>.<method>"` plus `":<args>"` when the call takes
 * arguments, e.g. `"notes.watch:日"`, `"activity.watchAllGenericChallenges:fill_the_kanji_n5"`.
 * The key must uniquely identify the call and its arguments.
 */
const cache = new WeakMap<EngineAPI, Map<string, QueryStore<unknown>>>();

export const getCachedStore = <T>(
  api: EngineAPI,
  key: string,
  create: (api: EngineAPI) => QueryStore<T>
): QueryStore<T> => {
  let stores = cache.get(api);
  if (!stores) {
    stores = new Map();
    cache.set(api, stores);
  }
  const existing = stores.get(key);
  if (existing) return existing as QueryStore<T>;

  const store = create(api);
  // Bound once so the function identities stay stable for
  // useSyncExternalStore.
  const stable: QueryStore<T> = {
    getSnapshot: () => store.getSnapshot(),
    subscribe: (listener) => store.subscribe(listener),
    refresh: () => store.refresh(),
  };
  stores.set(key, stable as QueryStore<unknown>);
  return stable;
};

/** The value of a ready, successful snapshot; otherwise undefined. */
export const snapshotValue = <T>(
  snapshot: QuerySnapshot<T> | { status: "unavailable" }
): T | undefined =>
  snapshot.status === "ready" && snapshot.result.ok
    ? snapshot.result.value
    : undefined;

export const AUTH_STATUS_KEY = "auth.watchStatus";
export const SYNC_STATUS_KEY = "sync.watchStatus";
export const BOOKMARKS_ALL_KEY = "bookmarks.watchAll";
export const REVIEW_PILE_ALL_KEY = "reviews.pile.watchAll";
