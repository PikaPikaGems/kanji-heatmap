import { useMemo } from "react";
import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  useGetKanjiInfoFn,
  useIsKanjiWorkerReady,
  useKanjiSearch,
  useWorkerQuery,
} from "@/kanji-worker/kanji-worker-hooks";
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
  const ready = useIsKanjiWorkerReady();

  // Word and reading come from the snapshot; the gloss and tag are fetched
  // once, here, because the deck displays them.
  const { data: repDetails, status: repStatus } = useWorkerQuery<
    Record<string, [string, string]>
  >(
    ready
      ? () => KANJI_WORKER_SINGLETON.request({ type: "rep-word-details" })
      : null,
    [ready]
  );

  const repWords = useMemo(() => {
    if (repDetails == null || getInfo == null) return null;

    const entries: Record<string, RepEntry> = {};
    for (const kanji of Object.keys(repDetails)) {
      const info = getInfo(kanji);
      if (info?.repWord == null) continue;
      const [englishGloss, emojiTag] = repDetails[kanji];
      entries[kanji] = [
        info.repWord,
        info.repReading ?? "",
        englishGloss,
        emojiTag,
      ];
    }
    return entries;
  }, [repDetails, getInfo]);

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
    repStatus === "loading" ||
    repStatus === "idle";
  const canStart = !loading && deck.length > 0;

  return { deck, loading, canStart };
};
