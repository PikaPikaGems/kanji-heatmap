import { useSyncExternalStore } from "react";

/**
 * The app-wide "✨ AI Explain" dialog for a single word, opened from a vocab
 * popover. It lives outside the popover (which closes as the dialog opens),
 * mounted once in App. `session` changes on every opening so the dialog
 * starts fresh.
 */
type WordExplainDialog = {
  open: boolean;
  word: string;
  /** The popover's English gloss, shown under the word. */
  english?: string;
  session: number;
};

let state: WordExplainDialog = { open: false, word: "", session: 0 };
const listeners = new Set<() => void>();

const set = (next: WordExplainDialog) => {
  state = next;
  for (const listener of listeners) listener();
};

export const openWordExplain = (word: string, english?: string) =>
  set({ open: true, word, english, session: state.session + 1 });

export const closeWordExplain = () => set({ ...state, open: false });

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useWordExplainDialog = () =>
  useSyncExternalStore(subscribe, () => state);
