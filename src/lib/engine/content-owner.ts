import { useSyncExternalStore } from "react";
import type { EngineAPI } from "engine-contract";
import { getEngineState, subscribeEngineState } from "./engine";
import { AUTH_STATUS_KEY, getCachedStore } from "./store-cache";

/** Owns everything saved on this device while nobody is logged in. */
export const GUEST_OWNER_ID = "guest";

/**
 * Who owns the saved AI content and API key on this device right now.
 *
 * - `unknown`: can't tell yet (the engine or the account status is loading,
 *   the account needs recovery, or its status failed). Show no owner's
 *   content and save nothing, or a logged-in user would see (or write into)
 *   the guest's.
 * - `known`: the logged-in account's user id, or `GUEST_OWNER_ID` when signed
 *   out or the engine can't run (including builds without it).
 */
export type ContentOwner =
  | { status: "unknown" }
  | { status: "known"; ownerId: string };

const UNKNOWN_OWNER: ContentOwner = { status: "unknown" };

// useSyncExternalStore needs the same object back while nothing changed.
let lastKnownOwner: Extract<ContentOwner, { status: "known" }> | null = null;
const knownOwner = (ownerId: string): ContentOwner => {
  if (lastKnownOwner?.ownerId !== ownerId) {
    lastKnownOwner = { status: "known", ownerId };
  }
  return lastKnownOwner;
};

const authStatusStore = (api: EngineAPI) =>
  getCachedStore(api, AUTH_STATUS_KEY, (a) => a.auth.watchStatus());

/**
 * Read it at call time, never keep it.
 *
 * Works outside React: lifecycle.ts keeps a subscription to the auth store for
 * the app's lifetime, which is what keeps its snapshot current.
 */
export const getCurrentOwner = (): ContentOwner => {
  // A build without the engine never loads one; don't wait for that to settle.
  if (!__STUDY_ENGINE_INCLUDED__) return knownOwner(GUEST_OWNER_ID);
  const engine = getEngineState();
  if (engine.status === "loading") return UNKNOWN_OWNER;
  if (engine.status === "unavailable") return knownOwner(GUEST_OWNER_ID);
  const snapshot = authStatusStore(engine.api).getSnapshot();
  if (snapshot.status !== "ready" || !snapshot.result.ok) return UNKNOWN_OWNER;
  const status = snapshot.result.value;
  if (status.status === "no_active_session") return knownOwner(GUEST_OWNER_ID);
  if (status.status === "active_session") return knownOwner(status.userId);
  return UNKNOWN_OWNER;
};

/** For code that can only run for a known owner (storage reads and writes). */
export const requireOwnerId = (): string => {
  const owner = getCurrentOwner();
  if (owner.status === "known") return owner.ownerId;
  throw new Error("Your account is still loading. Try again in a moment.");
};

// Follows the auth store of whichever engine is ready, including one that
// becomes ready after this subscription starts.
const subscribeOwner = (listener: () => void) => {
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
export const useCurrentOwner = (): ContentOwner =>
  useSyncExternalStore(subscribeOwner, getCurrentOwner);
