import { useSyncExternalStore } from "react";
import type { EngineAPI, QuerySnapshot, QueryStore } from "engine-contract";
import { useEngineState } from "./engine";
import { getCachedStore } from "./store-cache";

/** No engine in this build or browser, so the query can never load. */
export type UnavailableSnapshot = { status: "unavailable" };
export type EngineQuerySnapshot<T> = QuerySnapshot<T> | UnavailableSnapshot;

const LOADING: QuerySnapshot<never> = { status: "loading" };
const UNAVAILABLE: UnavailableSnapshot = { status: "unavailable" };
const noopSubscribe = () => () => {};
const getLoading = () => LOADING;

/**
 * Subscribes to an engine `watch*()` store. `key` identifies the call and its
 * arguments (see store-cache.ts); `create` makes the store the first time.
 *
 * While signed out, domain watches report
 * `{ status: "failed", diagnosticId: "no_active_session" }` — branch on the
 * account status (use-account-status.ts) rather than treating that as empty.
 */
export const useEngineQuery = <T>(
  key: string,
  create: (api: EngineAPI) => QueryStore<T>
): EngineQuerySnapshot<T> => {
  const engine = useEngineState();
  const store =
    engine.status === "ready" ? getCachedStore(engine.api, key, create) : null;
  const snapshot = useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    store ? store.getSnapshot : getLoading
  );
  return engine.status === "unavailable" ? UNAVAILABLE : snapshot;
};

/** The engine API once loaded, else null. For calling mutations. */
export const useEngineApi = (): EngineAPI | null => {
  const engine = useEngineState();
  return engine.status === "ready" ? engine.api : null;
};
