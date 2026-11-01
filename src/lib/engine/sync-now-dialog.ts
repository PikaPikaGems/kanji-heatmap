import { useSyncExternalStore } from "react";
import type { EngineAPI, SyncStatus } from "engine-contract";
import { copyForCode, SYNC_INCOMPLETE_COPY } from "./engine-copy";
import { snapshotValue } from "./store-cache";

/**
 * The app-wide "Sync now" dialog, opened from the week-old-changes banner and
 * the Unsynced changes dialog. Mounted once in App, not in the banner: the
 * banner goes away as soon as the sync succeeds, and the dialog has to stay to
 * say so.
 */
export type SyncNowStatus =
  | { kind: "syncing" }
  | { kind: "failed"; message: string }
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
      return { kind: "failed", message: copyForCode(result.error.code) };
    }
    const status = await readSyncStatus(api);
    // Never claim "synced" without seeing an empty outbox.
    if (!status) return { kind: "failed", message: copyForCode("") };
    const pending = status.pendingOperationsCount;
    if (pending === 0) return { kind: "synced" };
    if (status.pushBlocked || pending >= lastPending) {
      return { kind: "failed", message: SYNC_INCOMPLETE_COPY };
    }
    lastPending = pending;
  }
  return { kind: "failed", message: SYNC_INCOMPLETE_COPY };
};

/** Opens the dialog (if closed) and uploads every change; also "Try again". */
export const syncNow = async (api: EngineAPI) => {
  const id = ++runId;
  setState({ open: true, status: { kind: "syncing" } });
  let next: SyncNowStatus;
  try {
    next = await syncAllChanges(api);
  } catch {
    next = { kind: "failed", message: copyForCode("") };
  }
  if (id === runId) setState({ open: true, status: next });
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
