import { useSyncExternalStore } from "react";

/**
 * Open state of the app-wide "Why can't my account save?" dialog, opened by
 * the "Learn more" after "Your account can't save changes right now."
 * (premium lapsed); mounted once in App, like the login dialog.
 */
let open = false;
const listeners = new Set<() => void>();

const setOpen = (next: boolean) => {
  if (open === next) return;
  open = next;
  for (const listener of listeners) listener();
};

export const openWriteBlockedDialog = () => setOpen(true);
export const closeWriteBlockedDialog = () => setOpen(false);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useWriteBlockedDialogOpen = () =>
  useSyncExternalStore(subscribe, () => open);
