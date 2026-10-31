import { useSyncExternalStore } from "react";
import type { EngineAPI } from "engine-contract";
import { copyForCode } from "./engine-copy";

/**
 * The app-wide "Sync now" dialog, opened from the week-old-changes banner.
 * Mounted once in App, not in the banner: the banner goes away as soon as the
 * sync succeeds, and the dialog has to stay to say so.
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

/** Opens the dialog (if closed) and runs `sync.catchUp()`; also "Try again". */
export const syncNow = async (api: EngineAPI) => {
  const id = ++runId;
  setState({ open: true, status: { kind: "syncing" } });
  let next: SyncNowStatus;
  try {
    const result = await api.sync.catchUp();
    next = result.ok
      ? { kind: "synced" }
      : { kind: "failed", message: copyForCode(result.error.code) };
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
