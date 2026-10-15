import { useSyncExternalStore } from "react";
import type { EngineAPI } from "engine-contract";
import { getEngineState, subscribeEngineState } from "./engine";
import { AUTH_STATUS_KEY, getCachedStore, snapshotValue } from "./store-cache";

/** Owns everything saved on this device while nobody is logged in. */
export const GUEST_OWNER_ID = "guest";

const authStatusStore = (api: EngineAPI) =>
  getCachedStore(api, AUTH_STATUS_KEY, (a) => a.auth.watchStatus());

/**
 * Who owns content saved on this device right now: the logged-in account, else
 * the guest (logged out, engine or account still loading, recovery needed, or
 * a build without the engine). Read it at call time, never keep it.
 *
 * Works outside React: lifecycle.ts keeps a subscription to the auth store for
 * the app's lifetime, which is what keeps its snapshot current.
 */
export const getCurrentOwnerId = (): string => {
  const engine = getEngineState();
  if (engine.status !== "ready") return GUEST_OWNER_ID;
  const status = snapshotValue(authStatusStore(engine.api).getSnapshot());
  return status?.status === "active_session" ? status.userId : GUEST_OWNER_ID;
};

// Follows the auth store of whichever engine is ready, including one that
// becomes ready after this subscription starts.
const subscribeOwnerId = (listener: () => void) => {
  let unsubscribeAuth = () => {};
  const followAuth = () => {
    unsubscribeAuth();
    const engine = getEngineState();
    unsubscribeAuth =
      engine.status === "ready"
        ? authStatusStore(engine.api).subscribe(listener)
        : () => {};
  };
  followAuth();
  const unsubscribeEngine = subscribeEngineState(() => {
    followAuth();
    listener();
  });
  return () => {
    unsubscribeEngine();
    unsubscribeAuth();
  };
};

/**
 * The current owner as React state. Key or re-run anything that shows saved
 * AI content on it, so login and logout switch the content without a reload.
 */
export const useCurrentOwnerId = () =>
  useSyncExternalStore(subscribeOwnerId, getCurrentOwnerId);
