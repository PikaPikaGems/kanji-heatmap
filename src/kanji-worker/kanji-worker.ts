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
let KANJI_PHONETIC_MAP_CACHE: Record<string, string> = {};
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
// Request dispatch. Each request type gets one named handler in HANDLERS;
// onmessage itself only routes. Handlers reply via the `Reply` pair built
// once per message from the request id + type.
// ---------------------------------------------------------------------------

type Reply = {
  ok: (data?: unknown) => void;
  err: (error: { message: string }) => void;
};

type Handler = (payload: unknown, reply: Reply) => void;

const makeReply = (id: number, eventType: KanjiWorkerRequestName): Reply => ({
  ok: (data?: unknown) => {
    const response: PostMessageResponseType = {
      id,
      response: {
        requestType: eventType,
        status: "COMPLETED",
        data,
      },
    };
    self.postMessage(response);
  },
  err: (error: { message: string }) => {
    const response: PostMessageResponseType = {
      id,
      response: {
        requestType: eventType,
        status: "ERRORED",
        error: {
          message: `Message:${error.message}, request:${eventType} failed`,
        },
      },
    };
    console.error(response, error);
    self.postMessage(response);
  },
});

const MISSING_PAYLOAD_MESSAGE =
  "Please provide both an eventType and payload. One of them is missing";

const requirePayload =
  <T>(run: (payload: T, reply: Reply) => void): Handler =>
  (payload, reply) => {
    if (payload == null) {
      reply.err({ message: MISSING_PAYLOAD_MESSAGE });
      return;
    }
    run(payload as T, reply);
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
const withSimilarCacheIfNeeded = (
  settings: SearchSettings,
  reply: Reply,
  run: () => void
) => {
  const needsSimilarCache =
    settings.textSearch.type === "similar" && settings.textSearch.text !== "";

  if (!needsSimilarCache) {
    run();
    return;
  }

  ensureSimilarCache().then(run).catch(reply.err);
};

const handleSearch = requirePayload<SearchSettings>((settings, reply) => {
  // Main and extended load in parallel. A search that lands between those
  // completions used to throw on undefined.strokes and kill the worker.
  if (!areKanjiCachesReady()) {
    reply.err({ message: "Kanji caches not initialized" });
    return;
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

    reply.ok({ kanjis, possibleRadicals });
    return;
  }

  withSimilarCacheIfNeeded(settings, reply, () => {
    const kanjis: string[] = searchKanji(settings, getSearchPool());
    reply.ok({ kanjis });
  });
});

const handleSearchResultCount = requirePayload<SearchSettings>(
  (settings, reply) => {
    if (!areKanjiCachesReady()) {
      reply.err({ message: "Kanji caches not initialized" });
      return;
    }

    withSimilarCacheIfNeeded(settings, reply, () => {
      const pool = getSearchPool();
      const allKanji = Object.keys(pool.main);
      reply.ok(filterKanji(allKanji, settings, pool).length);
    });
  }
);

const handleKanjiExtended = requirePayload<string>((kanji, reply) => {
  const extendedInfo = KANJI_INFO_EXTENDED_CACHE[kanji];

  if (extendedInfo == null) {
    reply.err({ message: "No Kanji Info On Extended Cache" });
    return;
  }

  reply.ok({
    ...extendedInfo,
    vocabInfo: {
      first: retrieveVocabInfo(extendedInfo.mainVocab?.[0]),
      second: retrieveVocabInfo(extendedInfo.mainVocab?.[1]),
    },
  });
});

const handleKanjiSimilar = requirePayload<string>((kanji, reply) => {
  ensureSimilarCache()
    .then(() => {
      const similars = (KANJI_SIMILAR_CACHE[kanji] ?? []).filter(
        (similar) => KANJI_INFO_MAIN_CACHE[similar] != null
      );
      reply.ok(similars);
    })
    .catch(reply.err);
});

const HANDLERS: Record<KanjiWorkerRequestName, Handler> = {
  "initialize-extended-kanji-map": (_payload, reply) => {
    fetchExtendedKanjiInfo()
      .then(loadExtendedKanjiInfo)
      .then(() => reply.ok())
      .catch(reply.err);
  },
  "initialize-decomposition-map": (_payload, reply) => {
    fetchKanjiDecomposition()
      .then(loadKanjiDecomposition)
      .then(() => reply.ok())
      .catch(reply.err);
  },
  "initialize-segmented-vocab-map": (_payload, reply) => {
    fetchSegmentedVocab()
      .then(loadSegmentedVocabInfo)
      .then(() => reply.ok())
      .catch(reply.err);
  },
  "kanji-main-map": (_payload, reply) => {
    fetchMainKanjiInfo()
      .then(loadMainKanjiInfo)
      .then(() => reply.ok(KANJI_INFO_MAIN_CACHE))
      .catch(reply.err);
  },
  "part-keyword-map": (_payload, reply) => {
    fetchPartKeywordInfo()
      .then((r) => {
        KANJI_PART_KEYWORD_MAP_CACHE = r;
      })
      .then(() => reply.ok(KANJI_PART_KEYWORD_MAP_CACHE))
      .catch(reply.err);
  },
  "phonetic-map": (_payload, reply) => {
    fetchPhoneticInfo()
      .then((r) => {
        KANJI_PHONETIC_MAP_CACHE = r;
      })
      .then(() => reply.ok(KANJI_PHONETIC_MAP_CACHE))
      .catch(reply.err);
  },
  "retrieve-vocab-info": (payload, reply) => {
    reply.ok(retrieveVocabInfo(payload as string));
  },
  search: handleSearch,
  "search-result-count": handleSearchResultCount,
  "kanji-extended": handleKanjiExtended,
  "kanji-similar": handleKanjiSimilar,
};

self.onmessage = function (event: { data: OnMessageRequestType }) {
  const eventType = event.data.data.type;
  const payload = event.data.data.payload;
  const reply = makeReply(event.data.id, eventType);

  const handler = (HANDLERS as Record<string, Handler | undefined>)[eventType];
  if (handler == null) {
    reply.err({
      message:
        eventType == null || payload == null
          ? MISSING_PAYLOAD_MESSAGE
          : "Not implemented",
    });
    return;
  }

  handler(payload, reply);
};
