import { useSyncExternalStore } from "react";

/**
 * Open state of the app-wide pending / failed operations dialog (design 5.7).
 * Opened from the sidebar sync chip and the logout popover; mounted once in
 * App. `tab` asks for a specific tab; without it the dialog picks one.
 */
export type SyncOperationsTab = "pending" | "attention";

type SyncOperationsDialogState =
  | { open: false }
  | { open: true; tab: SyncOperationsTab | null };

const CLOSED: SyncOperationsDialogState = { open: false };
let state: SyncOperationsDialogState = CLOSED;
const listeners = new Set<() => void>();

const setState = (next: SyncOperationsDialogState) => {
  state = next;
  for (const listener of listeners) listener();
};

export const openSyncOperations = (tab: SyncOperationsTab | null = null) =>
  setState({ open: true, tab });
export const closeSyncOperations = () => {
  if (state.open) setState(CLOSED);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useSyncOperationsDialog = () =>
  useSyncExternalStore(subscribe, () => state);
