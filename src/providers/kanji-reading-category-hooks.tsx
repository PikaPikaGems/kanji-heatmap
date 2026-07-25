import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  useIsKanjiWorkerReady,
  useWorkerQuery,
} from "@/kanji-worker/kanji-worker-hooks";
import { oncePerSession } from "@/kanji-worker/worker-dataset-cache";
import { KanjiReadingsData } from "@/lib/kanji-section-constants";

const requestWorker = KANJI_WORKER_SINGLETON.request;

const loadReadingDetails = () =>
  oncePerSession("reading-details-map", () =>
    requestWorker({ type: "reading-details-map" })
  );

/**
 * Per-reading usefulness data, served by the worker on first use.
 *
 * Only the detail drawer's "Reading Usefulness" section reads this, and a
 * collapsed accordion does not mount its body, so nothing is fetched until
 * that section is expanded.
 */
export const useKanjiReadingDetails = (kanji: string) => {
  const ready = useIsKanjiWorkerReady();

  const { status, error, data } = useWorkerQuery<KanjiReadingsData>(
    ready ? loadReadingDetails : null,
    [ready]
  );

  const entries = data?.[kanji];

  return {
    status: status === "loading" ? "pending" : status,
    error,
    // Kanji with no reading breakdown are absent from the dataset; the section
    // treats null as "no info" and an empty array would render an empty table.
    kanjiReadingData: entries == null || entries.length === 0 ? null : entries,
  };
};
