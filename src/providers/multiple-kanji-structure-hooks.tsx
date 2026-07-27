import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  useIsKanjiWorkerReady,
  useWorkerQuery,
} from "@/kanji-worker/kanji-worker-hooks";
import { MultiKanjiStructureEntry } from "@/lib/kanji-section-constants";

const requestWorker = KANJI_WORKER_SINGLETON.request;

/**
 * One kanji's entry from the four merged per-source structure datasets.
 *
 * Only the detail drawer's "Character Structure" section reads this, and a
 * collapsed accordion does not mount its body, so nothing is fetched until
 * that section is expanded. The worker keeps the map and answers per kanji, so
 * the main thread never holds a copy — same shape as `kanji-general` and
 * `kanji-similar`, which the same drawer already uses.
 */
export const useMultiKanjiStructure = (kanji: string) => {
  const ready = useIsKanjiWorkerReady();

  const { status, error, data } =
    useWorkerQuery<MultiKanjiStructureEntry | null>(
      ready && kanji
        ? () => requestWorker({ type: "kanji-structure", payload: kanji })
        : null,
      [ready, kanji]
    );

  return {
    // The sections predate the worker's status vocabulary and render "..." for
    // "pending"; useWorkerQuery calls that state "loading".
    status: status === "loading" ? "pending" : status,
    error,
    kanjiStructureData: data ?? null,
  };
};
