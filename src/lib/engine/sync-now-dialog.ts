import { useSyncExternalStore } from "react";
import type { EngineAPI, SyncStatus } from "engine-contract";
import { copyForCode, SYNC_INCOMPLETE_COPY } from "./engine-copy";
import { snapshotValue } from "./store-cache";

/**
 * The app-wide "Sync now" dialog. The bottom banner's "Learn more" opens it on
 * "info" (why this device needs to sync, with a Sync now button); "Sync now"
 * elsewhere (Unsynced changes, saving-paused notices) opens it straight on
 * "syncing". Mounted once in App, not in the banner: the banner goes away as
 * soon as the sync succeeds, and the dialog has to stay to say so.
 */
export type SyncNowStatus =
  | { kind: "info" }
  | { kind: "syncing" }
  /** `code` goes in the copyable report; `message` is what the dialog says. */
  | { kind: "failed"; code: string; message: string }
  | { kind: "synced" };

/** `status` stays when it closes, so the dialog can animate out with it. */
export type SyncNowState = { open: boolean; status: SyncNowStatus };

let state: SyncNowState = { open: false, status: { kind: "syncing" } };
// Bumped by every run and by closing, so a run that finishes after the
// dialog was closed (or retried) doesn't change it.
let runId = 0;
const listeners = new Set<() => void>();

const setState = (next: SyncNowState) => {
  state = next;
  for (const listener of listeners) listener();
};

/** The first loaded `sync.watchStatus()` value; undefined if it failed. */
const readSyncStatus = (api: EngineAPI) =>
  new Promise<SyncStatus | undefined>((resolve) => {
    const store = api.sync.watchStatus();
    let done = false;
    let unsubscribe = () => {};
    const check = () => {
      const snapshot = store.getSnapshot();
      if (done || snapshot.status === "loading") return;
      done = true;
      unsubscribe();
      resolve(snapshotValue(snapshot));
    };
    // The store is lazy: it starts reading on the first subscribe.
    unsubscribe = store.subscribe(check);
    if (done) unsubscribe();
    check();
  });

const failed = (code: string, message = copyForCode(code)): SyncNowStatus => ({
  kind: "failed",
  code,
  message,
});

/** Enough rounds for a full outbox, one upload batch each. */
const MAX_SYNC_ROUNDS = 50;

/**
 * Uploads every waiting change. `catchUp()` being ok only means the cache is
 * current: it uploads one batch per call, and nothing while uploads are
 * blocked. So repeat it while the outbox shrinks, and only call it synced
 * when the outbox is empty.
 */
const syncAllChanges = async (api: EngineAPI): Promise<SyncNowStatus> => {
  let lastPending = Infinity;
  for (let round = 0; round < MAX_SYNC_ROUNDS; round++) {
    const result = await api.sync.catchUp();
    if (!result.ok) {
      return failed(result.error.code);
    }
    const status = await readSyncStatus(api);
    // Never claim "synced" without seeing an empty outbox.
    if (!status) return failed("sync_status_unreadable", copyForCode(""));
    const pending = status.pendingOperationsCount;
    if (pending === 0) return { kind: "synced" };
    if (status.pushBlocked) return failed("push_blocked", SYNC_INCOMPLETE_COPY);
    if (pending >= lastPending) {
      return failed("outbox_not_shrinking", SYNC_INCOMPLETE_COPY);
    }
    lastPending = pending;
  }
  return failed("max_rounds_reached", SYNC_INCOMPLETE_COPY);
};

/** Opens the dialog (if closed) and uploads every change; also "Try again". */
export const syncNow = async (api: EngineAPI) => {
  const id = ++runId;
  setState({ open: true, status: { kind: "syncing" } });
  let next: SyncNowStatus;
  try {
    next = await syncAllChanges(api);
  } catch (error) {
    next = failed(
      `exception: ${error instanceof Error ? error.message : String(error)}`,
      copyForCode("")
    );
  }
  if (id === runId) setState({ open: true, status: next });
};

/** Opens it on "info": why to sync, and a Sync now button (`syncNow`). */
export const openSyncNowDialog = () => {
  runId++;
  setState({ open: true, status: { kind: "info" } });
};

/** Closes it; a sync still running keeps going but no longer shows here. */
export const closeSyncNowDialog = () => {
  runId++;
  setState({ ...state, open: false });
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useSyncNowState = () =>
  useSyncExternalStore(subscribe, () => state);
