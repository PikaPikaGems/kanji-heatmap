import { DependencyList, useEffect, useMemo, useState } from "react";
import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import { useContextWithCatch } from "../providers/helpers";

import { SearchSettings } from "@/lib/settings/settings";
import { KanjiInfoRequestType } from "@/lib/kanji/kanji-info-types";
import { createContext } from "react";
import { useSearchSettings } from "@/providers/search-settings-hooks";
import { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { isKanji } from "@/lib/utils";
import { useClientFilteredKanjis } from "@/hooks/use-client-list-filters";

export type KanjiRequestFn = (
  k: string,
  type: KanjiInfoRequestType
) => Promise<unknown>;

export const ActionContext = createContext<KanjiRequestFn | null>(null);
export const IsReadyContext = createContext<boolean>(false);
export const GetBasicKanjiInfoContext = createContext<GetBasicKanjiInfo | null>(
  null
);

const requestWorker = KANJI_WORKER_SINGLETON.request;

type Status = "idle" | "loading" | "error" | "success";

interface QueryState<T> {
  status: Status;
  data?: T;
  error?: unknown;
}

/**
 * Shared machinery for every worker-backed hook below. Runs `run()` whenever
 * `deps` change and tracks {status, data, error}.
 *
 * The web worker does not guarantee that responses arrive in request order
 * (see kanji-worker-promise-wrapper). A per-effect `cancelled` flag drops any
 * response whose inputs are already stale, so a slow reply for an earlier
 * `deps` value can never clobber a fresher result. Effect deps double as the
 * request key, so an unchanged input never re-fires.
 *
 * Pass `run = null` to disable the query (empty / "none" inputs); the hook
 * resets to idle. `keepPreviousData` keeps the last data visible during the
 * next load (default true — avoids a flash of empty state between requests).
 */
const useWorkerQuery = <T,>(
  run: (() => Promise<T>) | null,
  deps: DependencyList,
  keepPreviousData = true
): QueryState<T> => {
  const [state, setState] = useState<QueryState<T>>({ status: "idle" });

  // Effect needed: dispatches a request to the web worker (external async
  // system) keyed to `deps`; the cancelled flag drops stale responses.
  useEffect(() => {
    if (run == null) {
      setState({ status: "idle", error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({
      status: "loading",
      data: keepPreviousData ? prev.data : undefined,
    }));

    run()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "success", data, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState((prev) => ({
            status: "error",
            data: keepPreviousData ? prev.data : undefined,
            error,
          }));
        }
      });

    return () => {
      cancelled = true;
    };
    // `run` is recreated each render but is keyed by `deps`, which encode every
    // input it closes over; listing it would re-fire on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
};

export const useKanjiWorkerRequest = () => {
  const fn = useContextWithCatch(
    ActionContext,
    "KanjiWorker",
    "KanjiWorkerRequest"
  );
  return fn;
};

export const useIsKanjiWorkerReady = () => {
  const ready = useContextWithCatch(
    IsReadyContext,
    "KanjiWorker",
    "IsKanjiWorkerReady"
  );
  return ready;
};

export const useGetKanjiInfoFn = () => {
  const fn = useContextWithCatch(
    GetBasicKanjiInfoContext,
    "KanjiWorker",
    "GetKanjiInfoFn"
  );
  return fn;
};

type SearchResult = { kanjis: string[]; possibleRadicals?: Set<string> };

export const useKanjiSearch = (searchSettings: SearchSettings) => {
  // ItemCountBadge (and similar) can mount before the worker finishes loading
  // main + extended maps. Searching with only main populated crashes the
  // worker on `exInfo.strokes` and rejects every pending request via onerror.
  const ready = useIsKanjiWorkerReady();

  const state = useWorkerQuery<SearchResult>(
    ready
      ? () =>
          requestWorker({
            type: "search",
            payload: searchSettings,
          }) as Promise<SearchResult>
      : null,
    [searchSettings, ready]
  );

  return {
    status: state.status,
    data: state.data?.kanjis,
    additionalData: state.data?.possibleRadicals,
    error: (state.error as string | undefined) ?? null,
  };
};

/** Shared across hook instances so list cells don't each hit the worker. */
let jouyouGradeMapCache: Record<string, number> | null = null;
let jouyouGradeMapPromise: Promise<Record<string, number>> | null = null;

const fetchJouyouGradeMap = () => {
  if (jouyouGradeMapCache) {
    return Promise.resolve(jouyouGradeMapCache);
  }
  if (!jouyouGradeMapPromise) {
    jouyouGradeMapPromise = requestWorker({
      type: "jouyou-grade-map",
    }).then((data) => {
      jouyouGradeMapCache = data as Record<string, number>;
      return jouyouGradeMapCache;
    });
  }
  return jouyouGradeMapPromise;
};

/** Kanji → jōyō school grade from the extended cache (ready once worker is). */
export const useJouyouGradeMap = (enabled = true) => {
  const ready = useIsKanjiWorkerReady();

  const state = useWorkerQuery<Record<string, number>>(
    ready && enabled ? fetchJouyouGradeMap : null,
    [ready, enabled]
  );

  return {
    status: state.status,
    data: state.data ?? jouyouGradeMapCache ?? undefined,
    error: (state.error as string | undefined) ?? null,
  };
};

export const useKanjiSearchCount = (searchSettings: SearchSettings) => {
  const ready = useIsKanjiWorkerReady();

  const state = useWorkerQuery<number>(
    ready
      ? () =>
          requestWorker({
            type: "search-result-count",
            payload: searchSettings,
          }) as Promise<number>
      : null,
    [searchSettings, ready]
  );

  return {
    status: state.status,
    data: state.data,
    error: (state.error as string | undefined) ?? null,
  };
};

export const useKanjiInfo = (
  kanji: string,
  requestType: KanjiInfoRequestType | "none"
) => {
  const requestFn = useKanjiWorkerRequest();

  const state = useWorkerQuery<unknown>(
    requestType === "none"
      ? null
      : () =>
          requestFn == null
            ? Promise.reject({
                message:
                  "requestFn does not exist. Please check KanjiWorkerProvider",
              })
            : requestFn(kanji, requestType),
    [kanji, requestType, requestFn]
  );

  return {
    status: state.status,
    data: state.data ?? null,
    error: (state.error as { message: string } | undefined) ?? null,
  };
};

export const useKanjiSearchResult = () => {
  const searchSettings = useSearchSettings();
  const results = useKanjiSearch(searchSettings);
  const { data: clientFiltered, isLoading: clientFilterLoading } =
    useClientFilteredKanjis(results.data, searchSettings.filterSettings);

  // Bookmark / anchor-word filters run on the main thread after the worker
  // search; keep the list in a loading state until those sets are ready.
  if (clientFilterLoading) {
    return {
      ...results,
      data: undefined,
      status: "loading" as const,
    };
  }

  return {
    ...results,
    data: clientFiltered,
  };
};

// Vocab types
export type WordPartDetail = [string, string?]; // [kanji/kana, reading?]

export interface VocabInfo {
  meaning: string;
  parts: WordPartDetail[];
}

type VocabWorkerResponse = {
  word: string;
  meaning: string;
  wordPartDetails: WordPartDetail[];
} | null;

// Hook to get vocab info for a specific word
export const useVocabDetails = (word: string) => {
  const state = useWorkerQuery<VocabInfo | null>(
    word
      ? () =>
          requestWorker({ type: "retrieve-vocab-info", payload: word }).then(
            (result) => {
              const response = result as VocabWorkerResponse;
              if (response == null) {
                return null;
              }
              return {
                meaning: response.meaning || "",
                parts: response.wordPartDetails,
              };
            }
          )
      : null,
    [word]
  );

  return {
    status: state.status,
    error:
      state.error == null
        ? null
        : state.error instanceof Error
          ? state.error
          : new Error(String(state.error)),
    vocabInfo: state.data ?? null,
  };
};

export const useWordKanjis = (word: string) => {
  const getKanjiInfo = useGetKanjiInfoFn();

  return useMemo(() => {
    if (!getKanjiInfo) {
      return [];
    }
    const uniqueKanjis = [...new Set((word || "").split("").filter(isKanji))];
    return uniqueKanjis.map((kanji) => ({
      kanji,
      keyword: getKanjiInfo(kanji)?.keyword || "Unknown",
    }));
  }, [word, getKanjiInfo]);
};

export const useSimilarKanjis = (kanji: string) => {
  const state = useWorkerQuery<string[]>(
    kanji
      ? () =>
          requestWorker({
            type: "kanji-similar",
            payload: kanji,
          }) as Promise<string[]>
      : null,
    [kanji],
    // Reset to empty between kanji so the previous kanji's matches never show
    // for the next one.
    false
  );

  return {
    status: state.status,
    data: kanji ? state.data : [],
    error: state.error == null ? null : String(state.error),
  };
};
