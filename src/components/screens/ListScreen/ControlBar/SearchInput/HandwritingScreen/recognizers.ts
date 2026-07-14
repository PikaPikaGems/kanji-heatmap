import { DrawingSubmitPayload } from "@/components/dependent/DrawingPad";
import { recognizeKanji } from "@/lib/kanjicanvas-adapter";
import { recognizeDaKanji } from "@/lib/dakanji-adapter";

// Resolve drawn strokes into candidate kanji (best match first). Implementations
// either call an external API (Google) or recognize on-device (kanjicanvas / DaKanji).
export type Recognizer = (payload: DrawingSubmitPayload) => Promise<string[]>;

const buildInkPayload = ({ strokes, width, height }: DrawingSubmitPayload) => {
  const ink = strokes.map((stroke) => {
    const xs: number[] = [];
    const ys: number[] = [];
    stroke.forEach(([x, y]) => {
      xs.push(Math.round(x));
      ys.push(Math.round(y));
    });
    return [xs, ys];
  });

  return {
    options: "enable_pre_space",
    requests: [
      {
        writing_guide: {
          writing_area_width: width,
          writing_area_height: height,
        },
        ink,
        language: "ja",
      },
    ],
  };
};

const parseCandidates = (data: unknown): string[] => {
  // Expected shape: ["SUCCESS", [["<hash>", ["時","持",...], [], {...}]]]
  if (
    Array.isArray(data) &&
    data[0] === "SUCCESS" &&
    Array.isArray(data[1]) &&
    Array.isArray(data[1][0]) &&
    Array.isArray(data[1][0][1])
  ) {
    return data[1][0][1] as string[];
  }
  return [];
};

// Google's online handwriting recognition (proxied via a Cloudflare function).
export const recognizeWithGoogle: Recognizer = async (payload) => {
  const response = await fetch("/api/handwriting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildInkPayload(payload)),
  });

  if (!response.ok) {
    throw new Error(`Handwriting API error: ${response.status}`);
  }

  const data = await response.json();
  return parseCandidates(data);
};

// On-device recognition via the lazily-loaded kanjicanvas engine (no API call).
export const recognizeWithKanjiCanvas: Recognizer = (payload) =>
  recognizeKanji(payload.strokes);

// On-device recognition via Dariyooo's DaKanji ONNX model (lazy-loaded).
export const recognizeWithDaKanji: Recognizer = (payload) =>
  recognizeDaKanji(payload);
