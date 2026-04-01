import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import wanakana from "@/lib/wanakana-adapter";
import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  GeneralKanjiItem,
  HoverItemReturnData,
  KanjiCacheItem,
  KanjiCacheType,
  KanjiInfoRequestType,
  KanjiPartKeywordCacheType,
  KanjiPhoneticCacheType,
  VocabExtendedInfo,
} from "@/lib/kanji/kanji-info-types";
import {
  GetBasicKanjiInfo,
  KanjiExtendedInfo,
  KanjiMainInfo,
} from "@/lib/kanji/kanji-worker-types";
import {
  ActionContext,
  GetBasicKanjiInfoContext,
  IsReadyContext,
} from "./kanji-worker-hooks";
import { radicalFalseFriends } from "@/lib/radicals";
const requestWorker = KANJI_WORKER_SINGLETON.request;

const extractKanjiHoverData = (
  kanjiInfo: KanjiCacheItem,
  kanjiInfoExtended: KanjiExtendedInfo & VocabExtendedInfo,
  kanjiCache?: KanjiCacheType | null,
  partKeywordCache?: KanjiPartKeywordCacheType | null,
  phoneticCache?: KanjiPhoneticCacheType | null
) => {
  const getPhonetic = () => {
    if (kanjiInfoExtended.phonetic == null) {
      return undefined;
    }
    const kanjiKeyword = kanjiCache?.[kanjiInfoExtended.phonetic]?.main.keyword;
    return {
      phonetic: kanjiInfoExtended.phonetic,
      sound: phoneticCache?.[kanjiInfoExtended.phonetic],
      keyword: kanjiKeyword ?? partKeywordCache?.[kanjiInfoExtended.phonetic],
      isKanji: kanjiKeyword != null,
    };
  };

  const getPartsList = (word: string) => {
    const parts = word.split("");
    const partCache: Record<string, string> = {};
    const isKanjiCache: Record<string, boolean> = {};
    parts.forEach((part) => {
      const kanjiKeyword = kanjiCache?.[part]?.main.keyword;
      const keyword = kanjiKeyword ?? partKeywordCache?.[part];

      if (keyword) {
        partCache[part] = keyword;
        isKanjiCache[part] = kanjiKeyword != null;
      }
    });

    return Object.keys(partCache).map((part) => {
      return {
        kanji: part,
        keyword: partCache[part],
        isKanji: isKanjiCache[part],
      };
    });
  };

  const phonetic = getPhonetic();

  const vocab = kanjiInfoExtended.vocabInfo;

  const result = {
    ...kanjiInfo.main,
    mainVocab: {
      first: vocab?.first
        ? { ...vocab.first, partsList: getPartsList(vocab.first.word) }
        : undefined,
      second: vocab?.second
        ? {
          ...vocab.second,
          partsList: getPartsList(vocab.second.word),
        }
        : undefined,
    },
    parts: Array.from(kanjiInfoExtended.parts).map((part) => {
      const kanjiKeyword = kanjiCache?.[part]?.main.keyword;
      return {
        part,
        keyword: kanjiKeyword ?? partKeywordCache?.[part],
        isKanji: kanjiKeyword != null,
      };
    }),
    frequency: kanjiInfo.main.frequency,
    phonetic,
  } as HoverItemReturnData;
  return result;
};

export function KanjiWorkerProvider({
  children,
  fallback = <div className="py-20"> Worker failed to load</div>,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const hasMounted = useRef(false);

  const kanjiCacheRef = useRef<KanjiCacheType | null>(null);
  const partKeywordCacheRef = useRef<KanjiPartKeywordCacheType | null>(null);
  const phoneticCacheRef = useRef<KanjiPhoneticCacheType | null>(null);
  const [workerError, setWorkerError] = useState(false);

  // populate kanji worker cache
  useEffect(() => {
    if (hasMounted.current) {
      return;
    }

    hasMounted.current = true;

    let mainReady = false;
    let partReady = false;
    let phoneticReady = false;
    let othersReady = false;

    const checkIfDone = () => {
      if (mainReady && partReady && phoneticReady && othersReady) {
        setIsReady(true);
        return;
      }
    };

    requestWorker({ type: "kanji-main-map" })
      .then((r) => {
        const res = r as Record<string, KanjiMainInfo>;
        kanjiCacheRef.current = {};
        Object.keys(res ?? {}).map((item) => {
          const info = res[item];
          // I don't know why typescript cannot detect this
          if (kanjiCacheRef.current == null) {
            console.error(
              "Please check your logic. kanjiCacheRef.current shouldn't be null at this point"
            );
            return;
          }

          kanjiCacheRef.current[item] = { main: info };
        });
        mainReady = true;
        checkIfDone();
      })
      .catch(() => {
        setWorkerError(true);
      });

    requestWorker({
      type: "part-keyword-map",
    })
      .then((r) => {
        partKeywordCacheRef.current = r as KanjiPartKeywordCacheType;
        partReady = true;
        checkIfDone();
      })
      .catch(() => {
        setWorkerError(true);
      });

    requestWorker({ type: "phonetic-map" })
      .then((r) => {
        phoneticCacheRef.current = r as KanjiPhoneticCacheType;
        phoneticReady = true;
        checkIfDone();
      })
      .catch(() => {
        setWorkerError(true);
      });

    Promise.all([
      requestWorker({
        type: "initialize-extended-kanji-map",
      }),
      requestWorker({ type: "initalize-segmented-vocab-map" }),
      requestWorker({ type: "initialize-decomposition-map" }),
    ])
      .then(() => {
        othersReady = true;
        checkIfDone();
      })
      .catch(() => {
        setWorkerError(true);
      });
  }, []);

  // function that can accept kanji info requests
  const kanjiInfoRequest = useCallback(
    async (kanji: string, type: KanjiInfoRequestType) => {
      if (kanjiCacheRef.current == null) {
        throw Error("kanjiCache not initialized");
      }

      const kanjiInfo = kanjiCacheRef.current[kanji];
      if (kanjiInfo == null) {
        throw Error("No information about this Kanji");
      }

      const getNecessaryValues = () => {
        if (kanjiInfo.extended == null) {
          throw Error(
            "Please fix logic. By the time you get here. kanjiInfo.extended should exist"
          );
        }

        if (type === "hover-card") {
          return extractKanjiHoverData(
            kanjiInfo,
            kanjiInfo.extended,
            kanjiCacheRef.current,
            partKeywordCacheRef.current,
            phoneticCacheRef.current
          );
        }

        if (type === "general") {
          const { allKun, allOn, meanings, jouyouGrade, wk, rtk, strokes, kklcIndex } =
            kanjiInfo.extended;

          return {
            allKun: Array.from(allKun),
            allOn: Array.from(allOn).map((item) => wanakana.toKatakana(item)),
            meanings,
            jouyouGrade,
            wk,
            rtk,
            strokes,
            kklcIndex
          } as GeneralKanjiItem;
        }

        throw Error(`${type} Not Implemented (${kanji})`);
      };

      if (kanjiInfo.extended == null) {
        const result = await requestWorker({
          type: "kanji-extended",
          payload: kanji,
        }).then((r) => {
          const res = r as KanjiExtendedInfo & VocabExtendedInfo;

          if (kanjiCacheRef?.current?.[kanji] == null) {
            throw Error("No information about this Kanji");
          }

          kanjiCacheRef.current[kanji].extended = res;
          return getNecessaryValues();
        });

        return result;
      }

      return getNecessaryValues();
    },
    []
  );

  const getKanjiBasicInfo: GetBasicKanjiInfo = useCallback((kanji) => {
    const main = kanjiCacheRef.current?.[kanji]?.main;
    const mainAlt = kanjiCacheRef.current?.[radicalFalseFriends[kanji]]?.main
    const keyword = partKeywordCacheRef.current?.[kanji] ?? partKeywordCacheRef.current?.[radicalFalseFriends[kanji]]


    return main ? main : mainAlt ? mainAlt : keyword ? { keyword } : null;
  }, []);

  if (workerError) {
    return fallback;
  }

  return (
    <ActionContext.Provider value={kanjiInfoRequest}>
      <IsReadyContext.Provider value={isReady}>
        <GetBasicKanjiInfoContext.Provider value={getKanjiBasicInfo}>
          {children}
        </GetBasicKanjiInfoContext.Provider>
      </IsReadyContext.Provider>
    </ActionContext.Provider>
  );
}
