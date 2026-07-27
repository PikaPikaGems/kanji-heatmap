import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  useIsKanjiWorkerReady,
  useWorkerQuery,
} from "@/kanji-worker/kanji-worker-hooks";
import { KanjiReadingEntry } from "@/lib/kanji-section-constants";

const requestWorker = KANJI_WORKER_SINGLETON.request;

/**
 * One kanji's reading-usefulness breakdown.
 *
 * Only the detail drawer's "Reading Usefulness" section reads this, and a
 * collapsed accordion does not mount its body, so nothing is fetched until
 * that section is expanded. The worker holds the dataset and answers per
 * kanji; it also collapses "absent" and "empty" to null, so the section's
 * "no info" state is decided in one place.
 */
export const useKanjiReadingDetails = (kanji: string) => {
  const ready = useIsKanjiWorkerReady();

  const { status, error, data } = useWorkerQuery<KanjiReadingEntry[] | null>(
    ready && kanji
      ? () => requestWorker({ type: "kanji-reading-details", payload: kanji })
      : null,
    [ready, kanji]
  );

  return {
    status: status === "loading" ? "pending" : status,
    error,
    kanjiReadingData: data ?? null,
  };
};
