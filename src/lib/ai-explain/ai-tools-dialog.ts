import { useSyncExternalStore } from "react";

export type AiToolsTab = "keys" | "tools" | "usage";

/**
 * Open state of the app-wide AI Study Tools dialog, and the tab it opens on.
 * Opened from the sidebar, the page footer and AI notices; mounted once in
 * App.
 */
type DialogState = { open: boolean; tab: AiToolsTab };

let state: DialogState = { open: false, tab: "keys" };
const listeners = new Set<() => void>();

const setState = (next: DialogState) => {
  if (state.open === next.open && state.tab === next.tab) return;
  state = next;
  for (const listener of listeners) listener();
};

export const openAiStudyTools = (tab: AiToolsTab = state.tab) =>
  setState({ open: true, tab });
export const closeAiStudyTools = () => setState({ ...state, open: false });
export const setAiStudyToolsTab = (tab: AiToolsTab) =>
  setState({ ...state, tab });

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useAiStudyToolsDialog = () =>
  useSyncExternalStore(subscribe, () => state);
