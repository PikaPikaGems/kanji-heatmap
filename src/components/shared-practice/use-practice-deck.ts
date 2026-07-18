import { useMemo } from "react";
import { useJsonFetch } from "@/hooks/use-json";
import {
  useGetKanjiInfoFn,
  useIsKanjiWorkerReady,
} from "@/kanji-worker/kanji-worker-hooks";
import assetsPaths from "@/lib/assets-paths";
import { buildPracticeDeck } from "./build-deck";
import { DeckFilterSettings, PracticeItem } from "./types";

type RepEntry = [string, string, string, string];

/**
 * Loads the representative-word data and builds the filtered practice deck —
 * the identical data flow both practice InitialScreens used to duplicate.
 */
export const usePracticeDeck = (settings: DeckFilterSettings) => {
  const workerReady = useIsKanjiWorkerReady();
  const getInfo = useGetKanjiInfoFn();
  const { data: repWords, status: repStatus } = useJsonFetch<
    Record<string, RepEntry>
  >(assetsPaths.KANJI_REPRESENTATIVE_WORDS);

  const deck: PracticeItem[] = useMemo(() => {
    if (!workerReady || !getInfo || !repWords) return [];
    return buildPracticeDeck({
      repWords,
      getJlpt: (kanji) => getInfo(kanji)?.jlpt ?? null,
      getKeyword: (kanji) => getInfo(kanji)?.keyword ?? "...",
      settings,
    });
  }, [workerReady, getInfo, repWords, settings]);

  const loading =
    !workerReady || repStatus === "pending" || repStatus === "idle";
  const canStart = !loading && deck.length > 0;

  return { deck, loading, canStart };
};
