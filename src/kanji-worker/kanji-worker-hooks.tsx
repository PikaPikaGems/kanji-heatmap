import { DependencyList, useEffect, useMemo, useState } from "react";
import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import { useContextWithCatch } from "../providers/helpers";

import { SearchSettings } from "@/lib/settings/settings";
import {
  GeneralKanjiItem,
  HoverItemReturnData,
  KanjiInfoRequestType,
} from "@/lib/kanji/kanji-info-types";
import { createContext } from "react";
import { useSearchSettings } from "@/providers/search-settings-hooks";
import {
  GetBasicKanjiInfo,
  SearchResponse,
} from "@/lib/kanji/kanji-worker-types";
import { isKanji } from "@/lib/utils";
import { useClientFilteredKanjis } from "@/hooks/use-client-list-filters";

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
 * `initialData` seeds the first render, so a remount with an answer already in
 * hand renders it immediately instead of flashing a loading state.
 */
export const useWorkerQuery = <T,>(
  run: (() => Promise<T>) | null,
  deps: DependencyList,
  keepPreviousData = true,
  initialData?: T
): QueryState<T> => {
  const [state, setState] = useState<QueryState<T>>(
    initialData === undefined
      ? { status: "idle" }
      : { status: "success", data: initialData }
  );

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

/**
 * Search results keyed by the settings that produced them.
 *
 * The list screen unmounts on every route change, so returning to it used to
 * restart the query from scratch and show the loading skeleton again for a
 * result the worker had already computed. The data is static, so a previous
 * answer for identical settings is always still correct.
 */
const searchResultCache = new Map<string, SearchResponse>();

const searchCacheKey = (settings: SearchSettings) => JSON.stringify(settings);

export const useKanjiSearch = (searchSettings: SearchSettings) => {
  // ItemCountBadge (and similar) can mount before the worker is ready; the
  // query stays idle until then rather than racing initialisation.
  const ready = useIsKanjiWorkerReady();
  const cacheKey = searchCacheKey(searchSettings);

  const state = useWorkerQuery<SearchResponse>(
    ready
      ? () =>
          requestWorker({
            type: "search",
            payload: searchSettings,
          }).then((response) => {
            searchResultCache.set(cacheKey, response);
            return response;
          })
      : null,
    [searchSettings, ready],
    true,
    searchResultCache.get(cacheKey)
  );

  return {
    status: state.status,
    data: state.data?.kanjis,
    additionalData: state.data?.possibleRadicals,
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
          })
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
  const state = useWorkerQuery<HoverItemReturnData | GeneralKanjiItem>(
    requestType === "none"
      ? null
      : () =>
          requestType === "hover-card"
            ? requestWorker({ type: "kanji-hover", payload: kanji })
            : requestWorker({ type: "kanji-general", payload: kanji }),
    [kanji, requestType]
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

// Hook to get vocab info for a specific word
export const useVocabDetails = (word: string) => {
  const state = useWorkerQuery<VocabInfo | null>(
    word
      ? () =>
          requestWorker({ type: "retrieve-vocab-info", payload: word }).then(
            (response) => {
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
          })
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
