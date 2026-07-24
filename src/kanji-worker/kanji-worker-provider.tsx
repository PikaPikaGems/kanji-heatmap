import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  KanjiCacheType,
  KanjiInfoRequestType,
  KanjiPartKeywordCacheType,
  KanjiPhoneticCacheType,
} from "@/lib/kanji/kanji-info-types";
import { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import {
  extractKanjiGeneralData,
  extractKanjiHoverData,
} from "./kanji-assembly";
import {
  ActionContext,
  GetBasicKanjiInfoContext,
  IsReadyContext,
} from "./kanji-worker-hooks";
import { radicalFalseFriends } from "@/lib/radicals";
const requestWorker = KANJI_WORKER_SINGLETON.request;

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

    // Ready means: every cache request resolved. The ref-fill requests run in
    // parallel with the worker-side initializations; one Promise.all replaces
    // the previous per-request done flags.
    Promise.all([
      requestWorker({ type: "kanji-main-map" }).then((res) => {
        const cache: KanjiCacheType = {};
        Object.keys(res ?? {}).forEach((item) => {
          cache[item] = { main: res[item] };
        });
        kanjiCacheRef.current = cache;
      }),
      requestWorker({ type: "part-keyword-map" }).then((map) => {
        partKeywordCacheRef.current = map;
      }),
      requestWorker({ type: "phonetic-map" }).then((map) => {
        phoneticCacheRef.current = map;
      }),
      requestWorker({ type: "initialize-extended-kanji-map" }),
      requestWorker({ type: "initialize-segmented-vocab-map" }),
      requestWorker({ type: "initialize-decomposition-map" }),
    ])
      .then(() => {
        setIsReady(true);
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
          return extractKanjiGeneralData(kanjiInfo, kanjiInfo.extended);
        }

        throw Error(`${type} Not Implemented (${kanji})`);
      };

      if (kanjiInfo.extended == null) {
        const result = await requestWorker({
          type: "kanji-extended",
          payload: kanji,
        }).then((res) => {
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
    const mainAlt = kanjiCacheRef.current?.[radicalFalseFriends[kanji]]?.main;
    const keyword =
      partKeywordCacheRef.current?.[kanji] ??
      partKeywordCacheRef.current?.[radicalFalseFriends[kanji]];

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
