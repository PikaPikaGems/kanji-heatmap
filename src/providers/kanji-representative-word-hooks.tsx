import { useMemo } from "react";

import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  useGetKanjiInfoFn,
  useIsKanjiWorkerReady,
  useWorkerQuery,
} from "@/kanji-worker/kanji-worker-hooks";

/**
 * A kanji's representative study word.
 *
 * The word and its reading are rendered by expanded grid tiles during render,
 * so they ride along in the main info snapshot. The English gloss and emoji
 * tag are only ever shown on detail surfaces and in practice decks, so they
 * stay worker-side and are fetched on first use.
 */
export interface RepresentativeWordData {
  word: string;
  reading: string;
}

export interface RepresentativeWordDetails extends RepresentativeWordData {
  englishGloss: string;
  tags: string[];
}

const requestWorker = KANJI_WORKER_SINGLETON.request;

const toRepresentativeWord = (
  info: { repWord?: string | null; repReading?: string | null } | null
): RepresentativeWordData | null =>
  info?.repWord == null
    ? null
    : { word: info.repWord, reading: info.repReading ?? "" };

/** Synchronous: safe to call during render, no loading state. */
export const useGetRepresentativeWordFn = () => {
  const getKanjiInfo = useGetKanjiInfoFn();

  return useMemo(
    () => (kanji: string) =>
      getKanjiInfo == null ? null : toRepresentativeWord(getKanjiInfo(kanji)),
    [getKanjiInfo]
  );
};

/** Synchronous word + reading for one kanji. */
export const useKanjiRepresentativeWord = (
  kanji: string
): RepresentativeWordData | null => {
  const getRepresentativeWord = useGetRepresentativeWordFn();
  return useMemo(
    () => getRepresentativeWord(kanji),
    [getRepresentativeWord, kanji]
  );
};

/**
 * Word, reading, gloss and tags. Triggers the one-time fetch of the gloss/tag
 * dataset, so only use it where those fields are actually displayed.
 */
export const useKanjiRepresentativeWordDetails = (
  kanji: string
): RepresentativeWordDetails | null => {
  const ready = useIsKanjiWorkerReady();
  const base = useKanjiRepresentativeWord(kanji);

  const { data } = useWorkerQuery<Record<string, [string, string]>>(
    ready ? () => requestWorker({ type: "rep-word-details" }) : null,
    [ready]
  );

  return useMemo(() => {
    if (base == null) {
      return null;
    }
    const [englishGloss, emojiTag] = data?.[kanji] ?? ["", ""];
    return { ...base, englishGloss, tags: emojiTag ? [emojiTag] : [] };
  }, [base, data, kanji]);
};
