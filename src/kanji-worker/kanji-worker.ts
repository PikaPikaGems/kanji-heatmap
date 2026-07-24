import {
  ExtendedKanjiInfoResponseType,
  KanjiExtendedInfo,
  KanjiMainInfo,
  KanjiWorkerRequestName,
  MainKanjiInfoResponseType,
  OnMessageRequestType,
  PostMessageResponseType,
  SegmentedVocabInfo,
  SegmentedVocabResponseType,
  WorkerApi,
} from "@/lib/kanji/kanji-worker-types";
import {
  fetchExtendedKanjiInfo,
  fetchKanjiDecomposition,
  fetchMainKanjiInfo,
  fetchPartKeywordInfo,
  fetchPhoneticInfo,
  fetchSegmentedVocab,
  fetchSimilarKanjis,
  transformToExtendedKanjiInfo,
  transformToMainKanjiInfo,
} from "./helpers";
import {
  filterKanji,
  getSortedByStrokeCount,
  searchByRadical,
  searchKanji,
} from "./kanji-search";
import { SearchSettings } from "@/lib/settings/settings";

const KANJI_INFO_MAIN_CACHE: Record<string, KanjiMainInfo> = {};
const KANJI_INFO_EXTENDED_CACHE: Record<string, KanjiExtendedInfo> = {};
const KANJI_DECOMPOSITION_CACHE: Record<string, Set<string>> = {};

let KANJI_SEGMENTED_VOCAB_CACHE: Record<string, SegmentedVocabInfo> = {};
let KANJI_PHONETIC_MAP_CACHE: Record<string, string[]> = {};
let KANJI_PART_KEYWORD_MAP_CACHE: Record<string, string> = {};
let KANJI_BY_STROKE_ORDER_CACHE: string[] = [];
let KANJI_SIMILAR_CACHE: Record<string, string[]> = {};
let similarCacheReady = false;
let similarCacheLoadPromise: Promise<Record<string, string[]>> | null = null;

const ensureSimilarCache = () => {
  if (similarCacheReady) {
    return Promise.resolve(KANJI_SIMILAR_CACHE);
  }
  if (similarCacheLoadPromise == null) {
    similarCacheLoadPromise = fetchSimilarKanjis()
      .then((map) => {
        KANJI_SIMILAR_CACHE = map;
        similarCacheReady = true;
        return map;
      })
      .catch((error) => {
        similarCacheLoadPromise = null;
        throw error;
      });
  }
  return similarCacheLoadPromise;
};

const loadMainKanjiInfo = (items: MainKanjiInfoResponseType) => {
  Object.keys(items).forEach((k) => {
    KANJI_INFO_MAIN_CACHE[k] = transformToMainKanjiInfo(items[k]);
  });
};

const loadExtendedKanjiInfo = (items: ExtendedKanjiInfoResponseType) => {
  Object.keys(items).forEach((k) => {
    KANJI_INFO_EXTENDED_CACHE[k] = transformToExtendedKanjiInfo(items[k]);
  });
};

const loadKanjiDecomposition = (items: Record<string, string>) => {
  Object.keys(items).forEach((k) => {
    KANJI_DECOMPOSITION_CACHE[k] = new Set([...items[k]]);
  });
};

const loadSegmentedVocabInfo = (map: SegmentedVocabResponseType) => {
  KANJI_SEGMENTED_VOCAB_CACHE = map;
};

const retrieveVocabInfo = (word?: string) => {
  if (word == null || KANJI_SEGMENTED_VOCAB_CACHE[word] == null) {
    return null;
  }

  return {
    word,
    meaning: KANJI_SEGMENTED_VOCAB_CACHE[word]?.meaning,
    wordPartDetails: KANJI_SEGMENTED_VOCAB_CACHE[word]?.parts,
  };
};

// ---------------------------------------------------------------------------
// Request dispatch. Every handler returns its response (or a promise of one)
// and throws to signal failure; onmessage owns the reply envelope. Payload and
// response types come from WorkerApi, so both sides of the protocol are
// checked by the compiler instead of cast.
// ---------------------------------------------------------------------------

const MISSING_PAYLOAD_MESSAGE =
  "Please provide both an eventType and payload. One of them is missing";

const requirePayload =
  <P, R>(run: (payload: P) => R) =>
  (payload: P | undefined): R => {
    if (payload == null) {
      throw new Error(MISSING_PAYLOAD_MESSAGE);
    }
    return run(payload);
  };

const getSearchPool = () => ({
  main: KANJI_INFO_MAIN_CACHE,
  extended: KANJI_INFO_EXTENDED_CACHE,
  similar: KANJI_SIMILAR_CACHE,
});

const areKanjiCachesReady = () =>
  Object.keys(KANJI_INFO_MAIN_CACHE).length > 0 &&
  Object.keys(KANJI_INFO_EXTENDED_CACHE).length > 0;

// "similar" searches need the lazily-fetched similar map before they can run;
// every other search runs synchronously against the in-memory caches.
const withSimilarCacheIfNeeded = <T>(
  settings: SearchSettings,
  run: () => T
): T | Promise<T> => {
  const needsSimilarCache =
    settings.textSearch.type === "similar" && settings.textSearch.text !== "";

  if (!needsSimilarCache) {
    return run();
  }

  return ensureSimilarCache().then(run);
};

const handleSearch = requirePayload((settings: SearchSettings) => {
  // Main and extended load in parallel. A search that lands between those
  // completions used to throw on undefined.strokes and kill the worker.
  if (!areKanjiCachesReady()) {
    throw new Error("Kanji caches not initialized");
  }

  // Side effect, the first time we search
  // we need to store this in cache which will be useful
  // when searching by radical
  if (KANJI_BY_STROKE_ORDER_CACHE.length === 0) {
    KANJI_BY_STROKE_ORDER_CACHE = getSortedByStrokeCount(getSearchPool());
  }

  if (
    settings.textSearch.type === "radicals" &&
    settings.textSearch.text !== ""
  ) {
    const { kanjis, possibleRadicals } = searchByRadical(
      KANJI_BY_STROKE_ORDER_CACHE,
      settings,
      getSearchPool(),
      KANJI_DECOMPOSITION_CACHE
    );

    return { kanjis, possibleRadicals };
  }

  return withSimilarCacheIfNeeded(settings, () => ({
    kanjis: searchKanji(settings, getSearchPool()),
  }));
});

const handleSearchResultCount = requirePayload((settings: SearchSettings) => {
  if (!areKanjiCachesReady()) {
    throw new Error("Kanji caches not initialized");
  }

  return withSimilarCacheIfNeeded(settings, () => {
    const pool = getSearchPool();
    const allKanji = Object.keys(pool.main);
    return filterKanji(allKanji, settings, pool).length;
  });
});

const handleKanjiExtended = requirePayload((kanji: string) => {
  const extendedInfo = KANJI_INFO_EXTENDED_CACHE[kanji];

  if (extendedInfo == null) {
    throw new Error("No Kanji Info On Extended Cache");
  }

  return {
    ...extendedInfo,
    vocabInfo: {
      first: retrieveVocabInfo(extendedInfo.mainVocab?.[0]),
      second: retrieveVocabInfo(extendedInfo.mainVocab?.[1]),
    },
  };
});

const handleKanjiSimilar = requirePayload((kanji: string) =>
  ensureSimilarCache().then(() =>
    (KANJI_SIMILAR_CACHE[kanji] ?? []).filter(
      (similar) => KANJI_INFO_MAIN_CACHE[similar] != null
    )
  )
);

const HANDLERS: {
  [K in KanjiWorkerRequestName]: (
    payload: WorkerApi[K]["payload"]
  ) => WorkerApi[K]["response"] | Promise<WorkerApi[K]["response"]>;
} = {
  "initialize-extended-kanji-map": () =>
    fetchExtendedKanjiInfo().then(loadExtendedKanjiInfo),
  "initialize-decomposition-map": () =>
    fetchKanjiDecomposition().then(loadKanjiDecomposition),
  "initialize-segmented-vocab-map": () =>
    fetchSegmentedVocab().then(loadSegmentedVocabInfo),
  "kanji-main-map": () =>
    fetchMainKanjiInfo().then((items) => {
      loadMainKanjiInfo(items);
      return KANJI_INFO_MAIN_CACHE;
    }),
  "jouyou-grade-map": () => {
    if (Object.keys(KANJI_INFO_EXTENDED_CACHE).length === 0) {
      throw new Error("Extended kanji cache not initialized");
    }
    const grades: Record<string, number> = {};
    for (const kanji of Object.keys(KANJI_INFO_EXTENDED_CACHE)) {
      grades[kanji] = KANJI_INFO_EXTENDED_CACHE[kanji].jouyouGrade;
    }
    return grades;
  },
  "part-keyword-map": () =>
    fetchPartKeywordInfo().then((map) => {
      KANJI_PART_KEYWORD_MAP_CACHE = map;
      return KANJI_PART_KEYWORD_MAP_CACHE;
    }),
  "phonetic-map": () =>
    fetchPhoneticInfo().then((map) => {
      KANJI_PHONETIC_MAP_CACHE = map;
      return KANJI_PHONETIC_MAP_CACHE;
    }),
  "retrieve-vocab-info": (word) => retrieveVocabInfo(word),
  search: handleSearch,
  "search-result-count": handleSearchResultCount,
  "kanji-extended": handleKanjiExtended,
  "kanji-similar": handleKanjiSimilar,
};

self.onmessage = function (event: { data: OnMessageRequestType }) {
  const { id, data } = event.data;
  const eventType = data.type;
  const payload = data.payload;

  const postReply = (response: PostMessageResponseType["response"]) => {
    self.postMessage({ id, response } satisfies PostMessageResponseType);
  };

  const postError = (message: string, cause?: unknown) => {
    const response: PostMessageResponseType["response"] = {
      requestType: eventType,
      status: "ERRORED",
      error: { message: `Message:${message}, request:${eventType} failed` },
    };
    console.error({ id, response }, cause);
    postReply(response);
  };

  const handler = (
    HANDLERS as Record<string, ((payload: unknown) => unknown) | undefined>
  )[eventType];

  if (handler == null) {
    postError(
      eventType == null || payload == null
        ? MISSING_PAYLOAD_MESSAGE
        : "Not implemented"
    );
    return;
  }

  // Wrapping in a resolved promise means a handler can throw or reject and
  // only that request fails; the worker itself stays alive.
  Promise.resolve()
    .then(() => handler(payload))
    .then((responseData) =>
      postReply({
        requestType: eventType,
        status: "COMPLETED",
        data: responseData,
      })
    )
    .catch((error: unknown) =>
      postError(error instanceof Error ? error.message : String(error), error)
    );
};
