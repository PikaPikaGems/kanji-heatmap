import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  useIsKanjiWorkerReady,
  useWorkerQuery,
} from "@/kanji-worker/kanji-worker-hooks";

const requestWorker = KANJI_WORKER_SINGLETON.request;

/**
 * Downloads indonesian_meanings.json into the worker. Rejects when the
 * download fails, so the switch can stay off and say so.
 */
export const downloadIndonesianMeanings = () =>
  requestWorker({ type: "indonesian-meanings-load" });

/**
 * One kanji's Indonesian meanings, or null when it has none. Only mounted
 * while "Show Indonesian meanings" is on, so nothing is fetched otherwise.
 * Previous data is not kept, so arrowing to a kanji without meanings never
 * shows the last kanji's.
 */
export function useIndonesianMeanings(kanji: string) {
  const ready = useIsKanjiWorkerReady();

  const { data } = useWorkerQuery<string[] | null>(
    ready && kanji
      ? () => requestWorker({ type: "indonesian-meanings", payload: kanji })
      : null,
    [ready, kanji],
    false
  );

  return data ?? null;
}
