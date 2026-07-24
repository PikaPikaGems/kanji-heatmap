import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  GetBasicKanjiInfo,
  InitSnapshot,
} from "@/lib/kanji/kanji-worker-types";
import { GetBasicKanjiInfoContext, IsReadyContext } from "./kanji-worker-hooks";
import { radicalFalseFriends } from "@/lib/radicals";

const requestWorker = KANJI_WORKER_SINGLETON.request;

/**
 * Holds the one copy of worker data that has to live on the main thread.
 *
 * Grid tiles read a kanji's keyword, frequency, JLPT level, jouyou grade and
 * representative word *during render*, where awaiting a promise is not an
 * option — an async lookup would paint every tile uncoloured and repaint it a
 * frame later. So the worker ships that map once at startup (~163 KB gzipped)
 * and everything else stays worker-side, fetched on the gesture that needs it.
 */
export function KanjiWorkerProvider({
  children,
  fallback = <div className="py-20"> Worker failed to load</div>,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const [workerError, setWorkerError] = useState(false);
  const snapshotRef = useRef<InitSnapshot | null>(null);

  // Effect needed: one request to an external system (the worker), whose
  // result is then read synchronously during render.
  useEffect(() => {
    let cancelled = false;

    requestWorker({ type: "init" })
      .then((snapshot) => {
        if (cancelled) return;
        snapshotRef.current = snapshot;
        setIsReady(true);
      })
      .catch(() => {
        if (!cancelled) setWorkerError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const getKanjiBasicInfo: GetBasicKanjiInfo = useCallback((kanji) => {
    const snapshot = snapshotRef.current;
    if (snapshot == null) {
      return null;
    }

    // Kanji first, then the same character under a lookalike codepoint, then
    // the component registry — a component has a keyword but no kanji info.
    const main =
      snapshot.mainInfoMap[kanji] ??
      snapshot.mainInfoMap[radicalFalseFriends[kanji]];
    if (main != null) {
      return main;
    }

    const keyword =
      snapshot.componentsMap[kanji]?.k ??
      snapshot.componentsMap[radicalFalseFriends[kanji]]?.k;

    return keyword ? { keyword } : null;
  }, []);

  if (workerError) {
    return fallback;
  }

  return (
    <IsReadyContext.Provider value={isReady}>
      <GetBasicKanjiInfoContext.Provider value={getKanjiBasicInfo}>
        {children}
      </GetBasicKanjiInfoContext.Provider>
    </IsReadyContext.Provider>
  );
}
