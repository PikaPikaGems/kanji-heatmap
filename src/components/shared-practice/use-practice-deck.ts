import { useMemo } from "react";
import { useJsonFetch } from "@/hooks/use-json";
import {
  useGetKanjiInfoFn,
  useKanjiSearch,
} from "@/kanji-worker/kanji-worker-hooks";
import assetsPaths from "@/lib/assets-paths";
import {
  defaultFilterSettings,
  defaultSearchTextSettings,
  defaultSortSettings,
} from "@/lib/settings/search-settings-adapter";
import { SearchSettings } from "@/lib/settings/settings";
import { buildPracticeDeck } from "./build-deck";
import { DeckFilterSettings, PracticeItem } from "./types";

type RepEntry = [string, string, string, string];

/**
 * Loads the representative-word data and builds the filtered practice deck —
 * the identical data flow both practice InitialScreens used to duplicate.
 */
export const usePracticeDeck = (settings: DeckFilterSettings) => {
  const getInfo = useGetKanjiInfoFn();
  const { data: repWords, status: repStatus } = useJsonFetch<
    Record<string, RepEntry>
  >(assetsPaths.KANJI_REPRESENTATIVE_WORDS);

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
    if (!getInfo || !repWords || filteredKanji.status !== "success") return [];
    return buildPracticeDeck({
      repWords,
      includedKanji: new Set(filteredKanji.data),
      getKeyword: (kanji) => getInfo(kanji)?.keyword ?? "...",
      settings,
    });
  }, [filteredKanji.data, filteredKanji.status, getInfo, repWords, settings]);

  const loading =
    filteredKanji.status === "loading" ||
    filteredKanji.status === "idle" ||
    repStatus === "pending" ||
    repStatus === "idle";
  const canStart = !loading && deck.length > 0;

  return { deck, loading, canStart };
};
