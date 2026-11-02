import { useSyncExternalStore } from "react";

/**
 * Open state of the app-wide local-cache recovery dialog (design 5.3). Opened
 * from the sidebar when the account status is `recovery` and from the login
 * dialog on `local_cache_unreadable`; mounted once in App, like the login
 * dialog.
 */
let open = false;
const listeners = new Set<() => void>();

const setOpen = (next: boolean) => {
  if (open === next) return;
  open = next;
  for (const listener of listeners) listener();
};

export const openRecoveryDialog = () => setOpen(true);
export const closeRecoveryDialog = () => setOpen(false);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useRecoveryDialogOpen = () =>
  useSyncExternalStore(subscribe, () => open);
