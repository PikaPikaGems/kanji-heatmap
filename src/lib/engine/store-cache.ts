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

/**
 * Keeps showing the last ready snapshot while the store reloads. The engine
 * drops a store back to "loading" around every sync, which would make the
 * sync status and failed count blink (an error line vanishing and coming
 * back). Listeners only hear about snapshots they would actually see.
 */
export const keepLastReady = <T>(store: QueryStore<T>): QueryStore<T> => {
  let shown = store.getSnapshot();
  const read = () => {
    const next = store.getSnapshot();
    if (next.status !== "loading" || shown.status !== "ready") shown = next;
    return shown;
  };
  return {
    getSnapshot: read,
    subscribe: (listener) => {
      let seen = read();
      return store.subscribe(() => {
        const now = read();
        if (now === seen) return;
        seen = now;
        listener();
      });
    },
    refresh: () => store.refresh(),
  };
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
export const FAILED_OPS_COUNT_KEY = "sync.watchFailedOpsCount";

/** The one sync status store, shared by the lifecycle and the UI. */
export const createSyncStatusStore = (api: EngineAPI) =>
  keepLastReady(api.sync.watchStatus());
export const BOOKMARKS_ALL_KEY = "bookmarks.watchAll";
export const REVIEW_PILE_ALL_KEY = "reviews.pile.watchAll";
