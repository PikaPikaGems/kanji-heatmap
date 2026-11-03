import { useRef, useState } from "react";
import { recognizeDaKanji, warmupDaKanji } from "@/lib/dakanji-adapter";
import { recognizeKanji, warmupKanjiCanvas } from "@/lib/kanjicanvas-adapter";
import type { DrawingSubmitPayload } from "@/lib/stroke-types";
import { formatModelLoadErrorReport } from "./format-model-load-error";
import { RECOGNIZE_TOP_K } from "./constants";

type RecognitionBackend = "dakanji" | "kanjicanvas" | "none";

export type LoadPhase =
  | { status: "loading-dakanji" }
  | { status: "loading-backup" }
  | { status: "error-lighter"; errorReport: string | null }
  | { status: "error-none"; errorReport: string | null };

const recognizeWithBackend = (
  backend: RecognitionBackend,
  payload: DrawingSubmitPayload
): Promise<string[]> => {
  if (backend === "dakanji") {
    return recognizeDaKanji(payload, RECOGNIZE_TOP_K);
  }
  if (backend === "kanjicanvas") {
    return recognizeKanji(payload.strokes);
  }
  return Promise.resolve([]);
};

/**
 * Handwriting recognizer for the writing games: loads DaKanji, falls back to
 * the lighter recognizer and then to none (each behind a confirm screen driven
 * by `loadPhase`). The choice is sticky for the visit.
 */
export const useHandwritingBackend = () => {
  const [loadPhase, setLoadPhase] = useState<LoadPhase>({
    status: "loading-dakanji",
  });
  // Sticky for the visit once the user commits to a backend (or none).
  const [backend, setBackend] = useState<RecognitionBackend | null>(null);
  const pendingCommitRef = useRef<(() => void) | null>(null);

  /**
   * Calls `commit` once a recognizer is ready. When none is chosen yet,
   * `park` runs first (the caller shows its loading / confirm screens from
   * `loadPhase`) and `commit` waits for `chooseBackend`.
   */
  const warmThenCommit = async (commit: () => void, park: () => void) => {
    if (backend != null) {
      commit();
      return;
    }

    pendingCommitRef.current = commit;
    setLoadPhase({ status: "loading-dakanji" });
    park();

    try {
      await warmupDaKanji();
      setBackend("dakanji");
      pendingCommitRef.current = null;
      commit();
      return;
    } catch (daKanjiError) {
      console.error("DaKanji warmup failed", daKanjiError);
      const errorReport = formatModelLoadErrorReport(daKanjiError);

      setLoadPhase({ status: "loading-backup" });
      try {
        await warmupKanjiCanvas();
        setLoadPhase({ status: "error-lighter", errorReport });
      } catch (canvasError) {
        console.error("KanjiCanvas warmup failed", canvasError);
        setLoadPhase({ status: "error-none", errorReport });
      }
    }
  };

  /** Records the choice made on a confirm screen; returns the parked commit. */
  const chooseBackend = (chosen: RecognitionBackend) => {
    setBackend(chosen);
    const commit = pendingCommitRef.current;
    pendingCommitRef.current = null;
    return commit;
  };

  /** Forgets a parked load (the user went back to the start screen). */
  const reset = () => {
    setLoadPhase({ status: "loading-dakanji" });
    pendingCommitRef.current = null;
  };

  const activeBackend = backend ?? "none";

  return {
    loadPhase,
    /** False when no recognizer is available: pick-only scoring. */
    gradingEnabled: activeBackend !== "none",
    recognize: (payload: DrawingSubmitPayload) =>
      recognizeWithBackend(activeBackend, payload),
    warmThenCommit,
    chooseBackend,
    reset,
  };
};
