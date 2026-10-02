import { useLocalStorageFlag } from "@/hooks/use-local-storage";

export const HIGHLIGHT_VOCAB_KANJI_KEY = "highlight-vocab-kanji";

/** Off by default (flag absent): vocab in notes gets a subtle underline only. */
export const useHighlightVocabKanji = () =>
  useLocalStorageFlag(HIGHLIGHT_VOCAB_KANJI_KEY);
