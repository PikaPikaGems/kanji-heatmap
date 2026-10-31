import { useMemo } from "react";
import {
  useGetKanjiInfoFn,
  useKanjiSearch,
} from "@/kanji-worker/kanji-worker-hooks";
import type { AnchorWordBasics } from "@/lib/kanji/anchor-words";
import { useGetAnchorWordsFn } from "@/providers/kanji-representative-word-hooks";
import {
  defaultFilterSettings,
  defaultSearchTextSettings,
  defaultSortSettings,
} from "@/lib/settings/search-settings-adapter";
import { useBookmarkedKanji } from "@/lib/engine/use-kanji-sets";
import { SearchSettings } from "@/lib/settings/settings";
import { buildPracticeDeck } from "./build-deck";
import { DeckFilterSettings, PracticeItem } from "./types";

/** Which of each kanji's anchor words a deck drills. */
export type DeckAnchor = "main" | "secondary";

/**
 * Loads the anchor words and builds the filtered practice deck of each
 * kanji's main (or secondary) word — the identical data flow every practice
 * InitialScreen used to duplicate. Kanji without that word are left out.
 */
export const usePracticeDeck = (
  settings: DeckFilterSettings,
  anchor: DeckAnchor = "main"
) => {
  const getInfo = useGetKanjiInfoFn();
  const getAnchorWords = useGetAnchorWordsFn();
  const bookmarks = useBookmarkedKanji();

  const searchSettings = useMemo<SearchSettings>(
    () => ({
      textSearch: defaultSearchTextSettings,
      filterSettings: {
        ...defaultFilterSettings,
        jlpt: settings.jlpt ?? [],
        jouyouGrade: settings.jouyouGrade ?? [],
      },
      sortSettings: defaultSortSettings,
    }),
    [settings.jlpt, settings.jouyouGrade]
  );
  const filteredKanji = useKanjiSearch(searchSettings);

  const deck: PracticeItem[] = useMemo(() => {
    if (!getInfo || !getAnchorWords || filteredKanji.status !== "success") {
      return [];
    }
    const words: Record<string, AnchorWordBasics> = {};
    for (const kanji of filteredKanji.data ?? []) {
      const anchors = getAnchorWords(kanji);
      const word = anchor === "main" ? anchors?.main : anchors?.secondary;
      if (word) words[kanji] = word;
    }
    return buildPracticeDeck({
      words,
      includedKanji: new Set(filteredKanji.data),
      bookmarkedKanji:
        bookmarks.status === "absent" ? undefined : bookmarks.kanji,
      getKeyword: (kanji) => getInfo(kanji)?.keyword ?? "...",
      settings,
    });
  }, [
    filteredKanji.data,
    filteredKanji.status,
    getInfo,
    getAnchorWords,
    anchor,
    settings,
    bookmarks.status,
    bookmarks.kanji,
  ]);

  const loading =
    (settings.bookmarkedOnly && bookmarks.status === "loading") ||
    filteredKanji.status === "loading" ||
    filteredKanji.status === "idle" ||
    getAnchorWords == null;
  const canStart = !loading && deck.length > 0;

  return { deck, loading, canStart };
};
