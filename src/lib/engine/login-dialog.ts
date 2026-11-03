import { useSyncExternalStore } from "react";

/**
 * Open state of the app-wide "Log in to Continue" dialog. Module-level so any
 * screen (drawer, games, sidebar, gated routes) can open it without prop
 * drilling; the dialog itself is mounted once in App. `session` counts the
 * openings, so every opening starts on the first step.
 */
type LoginDialogState = { open: boolean; session: number };

let state: LoginDialogState = { open: false, session: 0 };
const listeners = new Set<() => void>();

const setOpen = (next: boolean) => {
  if (state.open === next) return;
  state = {
    open: next,
    session: next ? state.session + 1 : state.session,
  };
  for (const listener of listeners) listener();
};

export const openLoginDialog = () => setOpen(true);
export const closeLoginDialog = () => setOpen(false);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useLoginDialog = () =>
  useSyncExternalStore(subscribe, () => state);
