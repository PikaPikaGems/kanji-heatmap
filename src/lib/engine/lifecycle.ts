import type { AuthStatus, EngineAPI, QuerySnapshot } from "engine-contract";
import {
  AUTH_STATUS_KEY,
  getCachedStore,
  createSyncStatusStore,
  SYNC_STATUS_KEY,
} from "./store-cache";

/** Pending writes are pushed this long after the last one, so bursts merge. */
const PUSH_DEBOUNCE_MS = 1500;
/** While writes stay pending (offline, failed attempt), retry this often. */
const RETRY_INTERVAL_MS = 60_000;
/** A failed catchUp() is not retried automatically sooner than this. */
const CATCH_UP_COOLDOWN_MS = 30_000;

const isActive = (snapshot: QuerySnapshot<AuthStatus>) =>
  snapshot.status === "ready" &&
  snapshot.result.ok &&
  snapshot.result.value.status === "active_session";

/**
 * App-lifetime engine housekeeping, set up once when the engine loads. Module
 * level rather than React effects: it never unmounts and no component owns it.
 *
 * - The engine does not push writes by itself, so whenever writes are pending
 *   and sync is idle, request a sync (debounced; requestSync() coalesces).
 * - Restored session at startup → requestSync(). A fresh login runs
 *   catchUp() itself (login dialog), so later sign-ins are not touched here.
 * - Back online / tab visible again → requestSync(); visible also refreshes
 *   the session with me() (host/guide/AUTH.md).
 * - Sync reports catch_up_required → catchUp() (host/guide/SYNC.md);
 *   requestSync() cannot resolve it. At most once per cooldown, so a failing
 *   catch-up doesn't loop.
 */
export const startEngineLifecycle = (api: EngineAPI) => {
  const auth = getCachedStore(api, AUTH_STATUS_KEY, (a) =>
    a.auth.watchStatus()
  );
  const sync = getCachedStore(api, SYNC_STATUS_KEY, createSyncStatusStore);

  const active = () => isActive(auth.getSnapshot());

  let pushTimer: ReturnType<typeof setTimeout> | undefined;
  const schedulePush = () => {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      if (active() && navigator.onLine) api.sync.requestSync();
    }, PUSH_DEBOUNCE_MS);
  };

  let sawFirstAuthStatus = false;
  auth.subscribe(() => {
    const snapshot = auth.getSnapshot();
    if (sawFirstAuthStatus || snapshot.status === "loading") return;
    sawFirstAuthStatus = true;
    if (isActive(snapshot)) api.sync.requestSync();
  });

  let catchingUp = false;
  let lastCatchUpAt = 0;
  sync.subscribe(() => {
    const snapshot = sync.getSnapshot();
    if (snapshot.status !== "ready" || !snapshot.result.ok) return;
    const status = snapshot.result.value;

    if (status.state === "idle" && status.pendingOperationsCount > 0) {
      schedulePush();
    }

    const needsCatchUp =
      status.state === "failed" && status.error.code === "catch_up_required";
    const coolingDown = Date.now() - lastCatchUpAt < CATCH_UP_COOLDOWN_MS;
    if (needsCatchUp && !catchingUp && !coolingDown) {
      catchingUp = true;
      lastCatchUpAt = Date.now();
      void api.sync.catchUp().finally(() => {
        catchingUp = false;
      });
    }
  });

  window.addEventListener("online", () => {
    if (active()) api.sync.requestSync();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (!navigator.onLine || !active()) return;
    void api.auth.me();
    api.sync.requestSync();
  });

  setInterval(() => {
    const snapshot = sync.getSnapshot();
    const pending =
      snapshot.status === "ready" &&
      snapshot.result.ok &&
      snapshot.result.value.pendingOperationsCount > 0;
    if (pending && active() && navigator.onLine) api.sync.requestSync();
  }, RETRY_INTERVAL_MS);
};
