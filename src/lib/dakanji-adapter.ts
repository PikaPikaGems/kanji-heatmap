import type { DrawingSubmitPayload, Stroke } from "@/lib/stroke-types";

// On-device single-character recognition via Dariyooo's DaKanji ONNX model.
// Everything (ORT JS, wasm, model, labels) loads only on the first recognize call.
//
// Pin onnxruntime-web@1.17.3 and force the non-SIMD / single-thread wasm build.
// Newer ORT only ships ort-wasm-simd-threaded, whose SharedArrayBuffer reservation
// OOMs on many iOS Safari versions (esp. iOS 17): "RangeError: Out of memory".
// See https://github.com/microsoft/onnxruntime/issues/22086

const MODEL_URL = "/onnx/char_classifier.onnx";
const LABELS_URL = "/onnx/char_classifier_labels.txt";
// Copied from node_modules by the vite `ort-wasm-copy` plugin.
const ORT_WASM_URL = "/onnx/ort-wasm.wasm";
const DEFAULT_TOP_K = 10;
// Match DrawingPad's perfect-freehand `size` so the raster looks like what the user drew.
const STROKE_WIDTH = 16;

type OrtWasm = typeof import("onnxruntime-web/wasm");
type InferenceSession = import("onnxruntime-web/wasm").InferenceSession;

type DaKanjiRuntime = {
  ort: OrtWasm;
  session: InferenceSession;
  labels: string;
};

type RasterImage = {
  pixels: Float32Array;
  width: number;
  height: number;
};

let runtimePromise: Promise<DaKanjiRuntime> | null = null;

const loadRuntime = (): Promise<DaKanjiRuntime> => {
  if (runtimePromise == null) {
    runtimePromise = (async () => {
      // Parallel: ORT JS + model labels (wasm is fetched by ORT after env setup).
      const [ort, labelsText] = await Promise.all([
        import("onnxruntime-web/wasm"),
        fetch(LABELS_URL).then((response) => {
          if (!response.ok) {
            throw new Error(
              `Failed to load DaKanji labels: ${response.status}`
            );
          }
          return response.text();
        }),
      ]);

      // Low-memory wasm: no worker threads, no SIMD → ort-wasm.wasm.
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = false;
      ort.env.wasm.wasmPaths = { "ort-wasm.wasm": ORT_WASM_URL };

      const labels = labelsText.trim();
      if (labels.length === 0) {
        throw new Error("DaKanji labels file is empty");
      }

      const session = await ort.InferenceSession.create(MODEL_URL);
      return { ort, session, labels };
    })().catch((error) => {
      // Allow a later recognize attempt to retry after a failed first load.
      runtimePromise = null;
      throw error;
    });
  }

  return runtimePromise;
};

// White ink on black, cropped to a square around the strokes. Black-on-white
// yields near-random kana on this model (ETL/KanjiVG training polarity).
const rasterizeStrokes = (
  strokes: Stroke[],
  width: number,
  height: number
): RasterImage => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (ctx == null) {
    throw new Error(
      "Could not create 2D canvas context for DaKanji rasterization"
    );
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0][0], stroke[0][1]);
    for (let i = 0; i < stroke.length; i++) {
      const [x, y] = stroke[i]!;
      if (i > 0) ctx.lineTo(x, y);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    if (stroke.length === 1) {
      ctx.lineTo(stroke[0][0], stroke[0][1]);
    }
    ctx.stroke();
  }

  // Expand bounds so round stroke caps aren't clipped, then pad ~10% more.
  const inkPad = STROKE_WIDTH;
  minX = Math.max(0, Math.floor(minX - inkPad));
  minY = Math.max(0, Math.floor(minY - inkPad));
  maxX = Math.min(width, Math.ceil(maxX + inkPad));
  maxY = Math.min(height, Math.ceil(maxY + inkPad));

  const cropW = Math.max(1, maxX - minX);
  const cropH = Math.max(1, maxY - minY);
  const margin = Math.ceil(Math.max(cropW, cropH) * 0.1);
  // Square crop so the in-graph resize doesn't squash the character.
  const side = Math.max(cropW, cropH) + margin * 2;
  let sx = Math.floor(minX - (side - cropW) / 2);
  let sy = Math.floor(minY - (side - cropH) / 2);
  if (sx < 0) sx = 0;
  if (sy < 0) sy = 0;
  if (sx + side > width) sx = Math.max(0, width - side);
  if (sy + side > height) sy = Math.max(0, height - side);
  const sw = Math.min(side, width - sx);
  const sh = Math.min(side, height - sy);

  const { data } = ctx.getImageData(sx, sy, sw, sh);
  const pixels = new Float32Array(sw * sh);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    pixels[p] = data[i]!;
  }

  return { pixels, width: sw, height: sh };
};

const topKLabels = (
  probs: Float32Array,
  labels: string,
  k: number
): string[] => {
  const indexed = Array.from({ length: probs.length }, (_, i) => i);
  indexed.sort((a, b) => probs[b]! - probs[a]!);

  const result: string[] = [];
  for (let i = 0; i < Math.min(k, indexed.length); i++) {
    const ch = labels[indexed[i]!];
    if (ch != null && ch !== "") {
      result.push(ch);
    }
  }
  return result;
};

/** Preload ORT + model + labels so the first recognize call is fast. */
export const warmupDaKanji = (): Promise<void> =>
  loadRuntime().then(() => undefined);

export const recognizeDaKanji = async (
  payload: DrawingSubmitPayload,
  topK: number = DEFAULT_TOP_K
): Promise<string[]> => {
  if (payload.strokes.length === 0) {
    return [];
  }

  const { ort, session, labels } = await loadRuntime();
  const { strokes, width, height } = payload;
  const image = rasterizeStrokes(strokes, width, height);
  const tensor = new ort.Tensor("float32", image.pixels, [
    1,
    1,
    image.height,
    image.width,
  ]);

  const feeds: Record<string, typeof tensor> = {
    [session.inputNames[0]!]: tensor,
  };
  const results = await session.run(feeds);
  const output = results[session.outputNames[0]!];
  if (output == null) {
    return [];
  }

  const probs = output.data as Float32Array;
  return topKLabels(probs, labels, topK);
};
