import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  useIsKanjiWorkerReady,
  useWorkerQuery,
} from "@/kanji-worker/kanji-worker-hooks";
import { usePreferIndonesianGlosses } from "@/hooks/use-prefer-indonesian-glosses";

const requestWorker = KANJI_WORKER_SINGLETON.request;

/**
 * Downloads indonesian_word_meanings.json into the worker. Rejects when the
 * download fails, so the switch can stay off and say so.
 */
export const downloadIndonesianWordMeanings = () =>
  requestWorker({ type: "indonesian-word-meanings-load" });

/**
 * One word's Indonesian gloss, or null when it has none or "Prefer Indonesian
 * vocabulary glosses" is off (then nothing is fetched). Previous data is not
 * kept, so a word without a gloss never shows the last word's.
 */
export function useIndonesianGloss(word: string) {
  const ready = useIsKanjiWorkerReady();
  const [preferIndonesian] = usePreferIndonesianGlosses();

  const { data } = useWorkerQuery<string | null>(
    ready && preferIndonesian && word
      ? () => requestWorker({ type: "indonesian-word-meaning", payload: word })
      : null,
    [ready, preferIndonesian, word],
    false
  );

  return data ?? null;
}
