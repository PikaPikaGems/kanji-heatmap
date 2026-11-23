import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  GetBasicKanjiInfo,
  InitSnapshot,
} from "@/lib/kanji/kanji-worker-types";
import {
  AnchorIndexContext,
  GetBasicKanjiInfoContext,
  IsReadyContext,
  RadicalsContext,
} from "./kanji-worker-hooks";
import type { AnchorIndex } from "@/lib/kanji/anchor-words";
import { componentKeyword } from "@/lib/radicals";

const requestWorker = KANJI_WORKER_SINGLETON.request;

/**
 * Holds the one copy of worker data that has to live on the main thread.
 *
 * Grid tiles read a kanji's keyword, frequency, JLPT level and jouyou grade
 * *during render*, where awaiting a promise is not an option — an async lookup
 * would paint every tile uncoloured and repaint it a frame later. So the worker
 * ships that map once at startup and everything else stays worker-side,
 * fetched on the gesture that needs it.
 *
 * The anchor index (each kanji's main word, its readings and its secondary
 * word) is asked for right after, without holding up first paint: tiles show
 * "·" until it lands, and the anchor-words filter and mastery wait for it.
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
  const [anchorIndex, setAnchorIndex] = useState<AnchorIndex | null>(null);

  // Effect needed: one request to an external system (the worker), whose
  // result is then read synchronously during render.
  useEffect(() => {
    let cancelled = false;

    requestWorker({ type: "init" })
      .then((snapshot) => {
        if (cancelled) return;
        snapshotRef.current = snapshot;
        setIsReady(true);
        // Right after the main info, ahead of the preload below. A failure
        // leaves tiles on "·"; the screens that wait for it keep their
        // loading state.
        requestWorker({ type: "anchor-index" })
          .then((index) => {
            if (!cancelled) setAnchorIndex(index);
          })
          .catch(() => {});
        // Best-effort: warm lazy datasets in the worker after first paint path.
        void requestWorker({ type: "preload" }).catch(() => {});
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

    // Only this exact character counts as a kanji. Aliases like ⺮ → 竹 are
    // radical variants, not the kanji itself; following them would make the
    // variant open a kanji link instead of a radical search.
    const main = snapshot.mainInfoMap[kanji];
    if (main != null) {
      return main;
    }

    const keyword = componentKeyword(
      kanji,
      snapshot.componentsMap,
      snapshot.radicals.aliases,
      (other) => snapshot.mainInfoMap[other]?.keyword
    );
    return keyword ? { keyword } : null;
  }, []);

  if (workerError) {
    return fallback;
  }

  return (
    <IsReadyContext.Provider value={isReady}>
      <GetBasicKanjiInfoContext.Provider value={getKanjiBasicInfo}>
        <RadicalsContext.Provider
          value={isReady ? (snapshotRef.current?.radicals ?? null) : null}
        >
          <AnchorIndexContext.Provider value={anchorIndex}>
            {children}
          </AnchorIndexContext.Provider>
        </RadicalsContext.Provider>
      </GetBasicKanjiInfoContext.Provider>
    </IsReadyContext.Provider>
  );
}
