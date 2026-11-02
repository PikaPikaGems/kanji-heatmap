import type {
  AuthStatus,
  EngineAPI,
  QuerySnapshot,
  SyncStatus,
} from "engine-contract";
import { getEngineState } from "./engine";
import { AUTH_STATUS_KEY, getCachedStore } from "./store-cache";
import {
  type AccountStatus,
  getWriteBlocker,
  useAccountStatus,
  type WriteBlocker,
} from "./use-account-status";
import { useSyncStatus } from "./sync-queries";
import { openWriteBlockedDialog } from "./write-blocked-dialog";

/**
 * Whether the logged-in account's data is on this device yet. Until it is,
 * the engine keeps every domain `watch*()` loading, so screens show this
 * instead of spinning forever.
 *
 * - `downloading`: the first download (or a full re-download) is running.
 * - `not-downloaded`: it failed, or hasn't run yet. Retries happen on app
 *   start, back online, tab visible again, and the Try again buttons.
 * - `ready`: downloaded, or no active account (nothing to download).
 *
 * Workaround: the engine doesn't expose its cache state yet
 * (PikaPikaGems/experimental-engine-docs#124), so this reads the sync status.
 * A finished download sets `lastSyncedAt`; a full re-download runs in
 * bootstrap mode. Swap the body when the engine exposes it.
 */
export type DataDownload = "ready" | "downloading" | "not-downloaded";

export const getDataDownload = (
  account: AccountStatus,
  sync: SyncStatus | undefined
): DataDownload => {
  // Unknown until the sync status loads: don't flash "not downloaded".
  if (account.kind !== "active" || sync === undefined) return "ready";
  const neverSynced = sync.lastSyncedAt === undefined;
  if (sync.state === "syncing") {
    return neverSynced || sync.mode === "bootstrap" ? "downloading" : "ready";
  }
  if (sync.state === "failed" && sync.mode === "bootstrap") {
    return "not-downloaded";
  }
  return neverSynced ? "not-downloaded" : "ready";
};

export const useDataDownload = (): DataDownload =>
  getDataDownload(useAccountStatus(), useSyncStatus());

/** Why a write can't run right now (data not downloaded first), or null. */
export const useWriteBlocker = (): WriteBlocker | null => {
  const account = useAccountStatus();
  return getWriteBlocker(account, getDataDownload(account, useSyncStatus()));
};

/**
 * Downloads the account's data again (`sync.catchUp()`). Screens that watch
 * engine data fill in by themselves once it lands. Resolves to the error
 * code when it failed, else null.
 */
export const retryDataDownload = async (): Promise<string | null> => {
  const engine = getEngineState();
  if (engine.status !== "ready") return "engine_unavailable";
  const result = await engine.api.sync.catchUp();
  return result.ok ? null : result.error.code;
};

/**
 * The auth status once it isn't loading. The engine drops its stores back to
 * loading around a sync, so right after a download it may not be ready yet.
 */
const readAuthStatus = (api: EngineAPI) =>
  new Promise<QuerySnapshot<AuthStatus>>((resolve) => {
    const store = getCachedStore(api, AUTH_STATUS_KEY, (a) =>
      a.auth.watchStatus()
    );
    const settled = () => {
      const snapshot = store.getSnapshot();
      if (snapshot.status === "loading") return false;
      resolve(snapshot);
      return true;
    };
    if (settled()) return;
    const unsubscribe = store.subscribe(() => {
      if (settled()) unsubscribe();
    });
  });

/** Whether the logged-in account can't save because premium isn't active. */
const hasNoPremium = async (api: EngineAPI) => {
  const snapshot = await readAuthStatus(api);
  if (snapshot.status !== "ready" || !snapshot.result.ok) return false;
  const status = snapshot.result.value;
  return (
    status.status === "active_session" &&
    !status.writeAccess.allowed &&
    status.writeAccess.reason === "entitlement_expired"
  );
};

/**
 * After the data downloads from the login dialog (or its "Couldn't download"
 * follow-up): every screen starts over with the account's data, and an
 * account without premium is told right away why it can't save.
 */
export const finishLoginDownload = async (resetApp: () => void) => {
  resetApp();
  const engine = getEngineState();
  if (engine.status === "ready" && (await hasNoPremium(engine.api))) {
    openWriteBlockedDialog();
  }
};
