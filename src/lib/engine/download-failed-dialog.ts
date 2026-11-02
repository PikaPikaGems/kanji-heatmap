import { useSyncExternalStore } from "react";

/**
 * Open state of the app-wide "Couldn't download your data" dialog, opened
 * when the download right after logging in fails; mounted once in App, like
 * the login dialog. `session` counts the openings, so each starts fresh.
 */
type DownloadFailedDialogState = { open: boolean; session: number };

let state: DownloadFailedDialogState = { open: false, session: 0 };
const listeners = new Set<() => void>();

const setOpen = (next: boolean) => {
  if (state.open === next) return;
  state = {
    open: next,
    session: next ? state.session + 1 : state.session,
  };
  for (const listener of listeners) listener();
};

export const openDownloadFailedDialog = () => setOpen(true);
export const closeDownloadFailedDialog = () => setOpen(false);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useDownloadFailedDialog = () =>
  useSyncExternalStore(subscribe, () => state);
