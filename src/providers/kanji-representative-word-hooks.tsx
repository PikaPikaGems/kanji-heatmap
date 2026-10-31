import { useMemo } from "react";
import {
  toAnchorWordBasics,
  withFrequencyTags,
  type AnchorWordBasics,
  type AnchorWordsDetailsFile,
  type KanjiAnchorWords,
} from "@/lib/kanji/anchor-words";

import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  useGetKanjiInfoFn,
  useIsKanjiWorkerReady,
  useWorkerQuery,
} from "@/kanji-worker/kanji-worker-hooks";

/**
 * A kanji's main anchor word (its "representative word").
 *
 * The word and its reading are rendered by expanded grid tiles during render,
 * so they ride along in the main info snapshot. Glosses, tags, ranks and the
 * secondary word are only shown on detail surfaces and in games, so they stay
 * worker-side and are fetched on first use.
 */
export interface RepresentativeWordData {
  word: string;
  reading: string;
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

/** Until `loaded`, only the main word and its readings are known (no secondary word yet). */
export type LoadingAnchorWords = KanjiAnchorWords & { loaded: boolean };

const toBasics = (base: RepresentativeWordData) =>
  toAnchorWordBasics(base.word, base.reading, undefined);

/**
 * A kanji's anchor words with their glosses, tags, ranks and tiers. The main
 * word and its readings show at once (from the snapshot); the rest, and the
 * secondary word, fill in when the worker answers. Asks the worker for this
 * one kanji, so only use it where those fields are actually displayed.
 */
export const useKanjiAnchorWords = (
  kanji: string
): LoadingAnchorWords | null => {
  const ready = useIsKanjiWorkerReady();
  const base = useKanjiRepresentativeWord(kanji);

  const { data } = useWorkerQuery<KanjiAnchorWords | null>(
    ready && base != null
      ? () => requestWorker({ type: "kanji-anchor-words", payload: kanji })
      : null,
    [ready, kanji, base != null],
    false
  );

  if (base == null) return null;
  if (data != null && data.main.word === base.word) {
    return { ...data, loaded: true };
  }
  const basics = toBasics(base);
  return (
    basics && {
      main: withFrequencyTags(basics.main, undefined),
      secondary: null,
      loaded: false,
    }
  );
};

/**
 * Anchor words (word, readings, gloss) for any kanji, looked up
 * synchronously — for a whole deck or review queue, where the per-kanji hook
 * above doesn't fit. `null` until the details file has loaded.
 */
export const useGetAnchorWordsFn = () => {
  const ready = useIsKanjiWorkerReady();
  const getRepresentativeWord = useGetRepresentativeWordFn();

  const { data } = useWorkerQuery<AnchorWordsDetailsFile>(
    ready ? () => requestWorker({ type: "anchor-words-details" }) : null,
    [ready]
  );

  // Memo needed: practice decks memoize (and shuffle) on this function, so a
  // new one every render would rebuild and reshuffle the deck each render.
  return useMemo(() => {
    if (data == null) return null;
    return (kanji: string): KanjiAnchorWords<AnchorWordBasics> | null => {
      const base = getRepresentativeWord(kanji);
      return base && toAnchorWordBasics(base.word, base.reading, data[kanji]);
    };
  }, [data, getRepresentativeWord]);
};
