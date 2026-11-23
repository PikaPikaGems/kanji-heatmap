import { useContext, useMemo } from "react";
import {
  toAnchorWordBasics,
  withFrequencyTags,
  type AnchorIndex,
  type AnchorIndexEntry,
  type AnchorWordBasics,
  type KanjiAnchorWords,
} from "@/lib/kanji/anchor-words";

import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  AnchorIndexContext,
  useIsKanjiWorkerReady,
  useWorkerQuery,
} from "@/kanji-worker/kanji-worker-hooks";

/**
 * A kanji's main anchor word (its "representative word").
 *
 * The word and its reading are rendered by expanded grid tiles, so they come
 * in the anchor index the worker sends once right after startup
 * (kanji_words.json + word_readings.json). Glosses, tags, ranks and the
 * secondary word's details are only shown on detail surfaces and in games, so
 * they stay worker-side and are fetched on first use.
 */
export interface RepresentativeWordData {
  word: string;
  reading: string;
}

const requestWorker = KANJI_WORKER_SINGLETON.request;

/**
 * The anchor index lookup: a kanji's main word, its readings and its secondary
 * word ("" when none), or null when the kanji has no anchor word. The hook
 * returns null until the index has loaded.
 */
export type GetAnchorIndex = (kanji: string) => AnchorIndexEntry | null;

const lookupsByIndex = new WeakMap<AnchorIndex, GetAnchorIndex>();

/** Synchronous once loaded: safe to call during render. */
export const useGetAnchorIndexFn = (): GetAnchorIndex | null => {
  const index = useContext(AnchorIndexContext);
  if (index == null) return null;
  // One function per index, so callers that cache on it keep their cache.
  const cached = lookupsByIndex.get(index);
  if (cached) return cached;
  const lookup: GetAnchorIndex = (kanji) => index[kanji] ?? null;
  lookupsByIndex.set(index, lookup);
  return lookup;
};

/** A kanji's main word and its readings; null while loading and when it has none. */
export const useKanjiRepresentativeWord = (
  kanji: string
): RepresentativeWordData | null => {
  const entry = useGetAnchorIndexFn()?.(kanji);
  return entry ? { word: entry.word, reading: entry.reading } : null;
};

/** Until `loaded`, only the main word and its readings are known (no secondary word yet). */
export type LoadingAnchorWords = KanjiAnchorWords & { loaded: boolean };

/**
 * A kanji's anchor words with their glosses, tags, ranks and tiers. The main
 * word and its readings show at once (from the anchor index); the rest, and the
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
  return {
    main: withFrequencyTags(
      toAnchorWordBasics(base.word, base.reading, undefined),
      undefined,
      undefined
    ),
    secondary: null,
    loaded: false,
  };
};

/**
 * One word's tags and tier (anchor and sample words), from the worker. Null
 * while loading and when the word has none.
 */
export const useWordTags = (word: string) => {
  const ready = useIsKanjiWorkerReady();
  const { data } = useWorkerQuery<{ tags: string[]; tier: string } | null>(
    ready ? () => requestWorker({ type: "word-tags", payload: word }) : null,
    [ready, word],
    false
  );
  return data ?? null;
};

/**
 * Anchor words (word, readings, gloss) for any kanji, looked up
 * synchronously — for a whole deck or review queue, where the per-kanji hook
 * above doesn't fit. `null` until the word files have loaded, and while
 * `enabled` is false (nothing is fetched).
 */
export const useGetAnchorWordsFn = (enabled = true) => {
  const ready = useIsKanjiWorkerReady() && enabled;

  const { data } = useWorkerQuery<
    Record<string, KanjiAnchorWords<AnchorWordBasics>>
  >(ready ? () => requestWorker({ type: "anchor-words-details" }) : null, [
    ready,
  ]);

  // Memo needed: practice decks memoize (and shuffle) on this function, so a
  // new one every render would rebuild and reshuffle the deck each render.
  return useMemo(() => {
    if (data == null) return null;
    return (kanji: string): KanjiAnchorWords<AnchorWordBasics> | null =>
      data[kanji] ?? null;
  }, [data]);
};
