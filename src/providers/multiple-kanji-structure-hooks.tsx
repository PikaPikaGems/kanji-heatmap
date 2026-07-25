import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  useIsKanjiWorkerReady,
  useWorkerQuery,
} from "@/kanji-worker/kanji-worker-hooks";
import { oncePerSession } from "@/kanji-worker/worker-dataset-cache";
import { MultiKanjiStructureData } from "@/lib/kanji-section-constants";

const requestWorker = KANJI_WORKER_SINGLETON.request;

const loadStructures = () =>
  oncePerSession("structures-map", () =>
    requestWorker({ type: "structures-map" })
  );

/**
 * The four per-source structure datasets, merged into one file and served by
 * the worker on first use.
 *
 * Only the detail drawer's "Character Structure" section reads this, and a
 * collapsed accordion does not mount its body, so nothing is fetched until
 * that section is expanded. The response is the whole map: the user arrows
 * from kanji to kanji inside the drawer, so one round trip on first open beats
 * a request per kanji.
 */
export const useMultiKanjiStructure = (kanji: string) => {
  const ready = useIsKanjiWorkerReady();

  const { status, error, data } = useWorkerQuery<MultiKanjiStructureData>(
    ready ? loadStructures : null,
    [ready]
  );

  return {
    // The sections predate the worker's status vocabulary and render "..." for
    // "pending"; useWorkerQuery calls that state "loading".
    status: status === "loading" ? "pending" : status,
    error,
    kanjiStructureData: data?.[kanji] ?? null,
  };
};
