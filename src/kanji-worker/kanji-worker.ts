import {
  ExtendedKanjiInfoResponseType,
  KanjiExtendedInfo,
  KanjiMainInfo,
  MainKanjiInfoResponseType,
  OnMessageRequestType,
  PostMessageResponseType,
  SegmentedVocabInfo,
  SegmentedVocabResponseType,
} from "@/lib/kanji/kanji-worker-types";
import {
  fetchExtendedKanjiInfo,
  fetchKanjiDecomposition,
  fetchMainManjiInfo,
  fetchPartKeywordInfo,
  fetchPhoneticInfo,
  fetchSegmentedVocab,
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

self.onmessage = function (event: { data: OnMessageRequestType }) {
  const eventType = event.data.data.type;
  const payload = event.data.data.payload;
  const id = event.data.id;

  const sendResponse = (data?: unknown) => {
    const response: PostMessageResponseType = {
      id,
      response: {
        requestType: eventType,
        status: "COMPLETED",
        data,
      },
    };
    self.postMessage(response);
  };

  const sendError = (error: { message: string }) => {
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
  };

  if (eventType === "initialize-extended-kanji-map") {
    fetchExtendedKanjiInfo()
      .then(loadExtendedKanjiInfo)
      .then(sendResponse)
      .catch(sendError);

    return;
  }

  if (eventType === "initialize-decomposition-map") {
    fetchKanjiDecomposition()
      .then(loadKanjiDecomposition)
      .then(sendResponse)
      .catch(sendError);

    return;
  }

  if (eventType === "initalize-segmented-vocab-map") {
    fetchSegmentedVocab()
      .then(loadSegmentedVocabInfo)
      .then(sendResponse)
      .catch(sendError);

    return;
  }

  if (eventType === "kanji-main-map") {
    fetchMainManjiInfo()
      .then(loadMainKanjiInfo)
      .then(() => sendResponse(KANJI_INFO_MAIN_CACHE))
      .catch(sendError);

    return;
  }

  if (eventType === "part-keyword-map") {
    fetchPartKeywordInfo()
      .then((r) => {
        KANJI_PART_KEYWORD_MAP_CACHE = r;
      })
      .then(() => sendResponse(KANJI_PART_KEYWORD_MAP_CACHE))
      .catch(sendError);

    return;
  }

  if (eventType === "phonetic-map") {
    fetchPhoneticInfo()
      .then((r) => {
        KANJI_PHONETIC_MAP_CACHE = r;
      })
      .then(() => sendResponse(KANJI_PHONETIC_MAP_CACHE))
      .catch(sendError);

    return;
  }

  if (eventType === "retrieve-vocab-info") {
    const vocabInfo = retrieveVocabInfo(payload as string);
    sendResponse(vocabInfo);
    return;
  }

  if (eventType == null || payload == null) {
    sendError({
      message:
        "Please provide both an eventType and payload. One of them is missing",
    });
    return;
  }

  const settings = payload as SearchSettings;
  const kanjiPool = {
    main: KANJI_INFO_MAIN_CACHE,
    extended: KANJI_INFO_EXTENDED_CACHE,
  };

  if (eventType === "search") {
    // Side effect, the first time we search
    // we need to store this in cache which will be useful
    // when searching by radical
    if (KANJI_BY_STROKE_ORDER_CACHE.length === 0) {
      KANJI_BY_STROKE_ORDER_CACHE = getSortedByStrokeCount(kanjiPool);
    }

    if (
      settings.textSearch.type === "radicals" &&
      settings.textSearch.text !== ""
    ) {
      const { kanjis, possibleRadicals } = searchByRadical(
        KANJI_BY_STROKE_ORDER_CACHE,
        settings,
        kanjiPool,
        KANJI_DECOMPOSITION_CACHE
      );

      sendResponse({ kanjis, possibleRadicals });
      return;
    }

    const kanjis: string[] = searchKanji(settings, kanjiPool);
    sendResponse({ kanjis });
    return;
  }

  if (eventType === "search-result-count") {
    const allKanji = Object.keys(kanjiPool.main);
    const filterCount = filterKanji(allKanji, settings, kanjiPool).length;
    sendResponse(filterCount);
    return;
  }

  if (eventType === "kanji-extended") {
    const extendedInfo = KANJI_INFO_EXTENDED_CACHE[payload as string];

    if (extendedInfo == null) {
      sendError({ message: "No Kanji Info On Extended Cache" });
      return;
    }

    sendResponse({
      ...extendedInfo,
      vocabInfo: {
        first: retrieveVocabInfo(extendedInfo.mainVocab?.[0]),
        second: retrieveVocabInfo(extendedInfo.mainVocab?.[1]),
      },
    });
    return;
  }

  sendError({ message: "Not implemented" });
};
