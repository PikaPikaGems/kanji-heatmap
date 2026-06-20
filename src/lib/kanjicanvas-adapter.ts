import { Stroke } from "@/components/dependent/DrawingPad";

// Minimal surface of the global `window.KanjiCanvas` object that we drive
// directly. KanjiCanvas.recognize() is hard-wired to a real <canvas> element,
// so instead we feed our DrawingPad strokes straight into its (DOM-free)
// recognition pipeline: momentNormalize -> extractFeatures -> coarse -> fine.
type KanjiCanvasGlobal = {
  refPatterns: unknown[];
  momentNormalize: (id: string) => unknown;
  extractFeatures: (normalized: unknown, interval: number) => unknown;
  coarseClassification: (features: unknown) => unknown;
  fineClassification: (features: unknown, candidates: unknown) => string;
  [key: string]: unknown;
};

// Arbitrary key; the pipeline reads strokes from `recordedPattern_<id>`.
const RECOGNIZER_ID = "kanji-heatmap-handwriting-alt";

let kanjiCanvasPromise: Promise<KanjiCanvasGlobal> | null = null;

// Lazily load the (large, ~6.7MB) recognition engine + reference patterns the
// first time the user actually recognizes a kanji. Both are plain browser
// scripts imported for their side effect of populating `window.KanjiCanvas`.
const loadKanjiCanvas = (): Promise<KanjiCanvasGlobal> => {
  if (kanjiCanvasPromise == null) {
    kanjiCanvasPromise = (async () => {
      await import("kanjicanvas/docs/resources/javascript/kanji-canvas.js");
      await import("kanjicanvas/docs/resources/javascript/ref-patterns.js");

      const kanjiCanvas = (
        window as unknown as { KanjiCanvas?: KanjiCanvasGlobal }
      ).KanjiCanvas;

      if (kanjiCanvas == null) {
        throw new Error("KanjiCanvas failed to load");
      }

      return kanjiCanvas;
    })();
  }

  return kanjiCanvasPromise;
};

// Recognize a kanji from drawn strokes entirely on-device (no API call).
// Returns the best candidate kanji, most likely first.
export const recognizeKanji = async (strokes: Stroke[]): Promise<string[]> => {
  if (strokes.length === 0) {
    return [];
  }

  const kanjiCanvas = await loadKanjiCanvas();

  kanjiCanvas[`recordedPattern_${RECOGNIZER_ID}`] = strokes;
  const normalized = kanjiCanvas.momentNormalize(RECOGNIZER_ID);
  const features = kanjiCanvas.extractFeatures(normalized, 20);
  const candidates = kanjiCanvas.coarseClassification(features);

  // fineClassification returns up to 10 candidates joined by whitespace,
  // e.g. "時  持  待".
  const result = kanjiCanvas.fineClassification(features, candidates);
  return result.split(/\s+/).filter(Boolean);
};
