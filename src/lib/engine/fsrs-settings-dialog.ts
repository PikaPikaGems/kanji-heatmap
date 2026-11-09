import { useSyncExternalStore } from "react";

/**
 * Open state of the app-wide FSRS settings dialog (design 5.6). Opened from
 * the sidebar and, later, the mastery game start screens; mounted once in App.
 */
let open = false;
const listeners = new Set<() => void>();

const setOpen = (next: boolean) => {
  if (open === next) return;
  open = next;
  for (const listener of listeners) listener();
};

export const openFsrsSettings = () => setOpen(true);
export const closeFsrsSettings = () => setOpen(false);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useFsrsSettingsOpen = () =>
  useSyncExternalStore(subscribe, () => open);
