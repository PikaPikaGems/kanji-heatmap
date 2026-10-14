import { useSyncExternalStore } from "react";

/**
 * Open state of the app-wide "Login required" dialog. Module-level so any
 * screen (drawer, games, sidebar, gated routes) can open it without prop
 * drilling; the dialog itself is mounted once in App.
 */
let open = false;
const listeners = new Set<() => void>();

const setOpen = (next: boolean) => {
  if (open === next) return;
  open = next;
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

export const useLoginDialogOpen = () =>
  useSyncExternalStore(subscribe, () => open);
