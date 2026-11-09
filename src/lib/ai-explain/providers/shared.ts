import type { AiSource } from "./types";

export const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export const arrayOf = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

export const numberOf = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;

export const sourceOf = (value: unknown): AiSource | undefined => {
  const record = asRecord(value);
  const url = record.url ?? record.uri;
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return undefined;
  return { url, title: typeof record.title === "string" ? record.title : url };
};

/** Collects sources once per URL, in the order they first appear. */
export const sourceCollector = () => {
  const sources = new Map<string, AiSource>();
  return {
    add: (value: unknown) => {
      const source = sourceOf(value);
      if (source && !sources.has(source.url)) sources.set(source.url, source);
    },
    list: () => [...sources.values()],
  };
};

/**
 * Reads server-sent events, calling `onEvent` with each `data:` JSON object,
 * including a final event without a trailing newline.
 */
export const readEvents = async (
  res: Response,
  onEvent: (event: Record<string, unknown>) => void
) => {
  if (!res.body) throw new Error("The response was empty.");
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let pending = "";
  const consume = (line: string) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    onEvent(JSON.parse(data) as Record<string, unknown>);
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += value;
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) consume(line.replace(/\r$/, ""));
    }
    if (pending.trim()) consume(pending.trim());
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};

/**
 * The message in a failed response's JSON body, whichever shape the provider
 * uses (`{ error: "…" }`, `{ error: { message } }`, `{ detail: { message } }`
 * or `{ detail: "…" }`), and its machine-readable status or code, if any.
 */
export const readErrorBody = async (
  res: Response
): Promise<{ message: string; code: string }> => {
  try {
    const body = asRecord(await res.json());
    const error = body.error ?? body.detail;
    if (typeof error === "string") return { message: error, code: "" };
    const record = asRecord(error);
    const message =
      typeof record.message === "string"
        ? record.message
        : typeof body.message === "string"
          ? body.message
          : "";
    const code = [record.status, record.code, record.type, body.type].find(
      (value): value is string => typeof value === "string"
    );
    return { message, code: code ?? "" };
  } catch {
    return { message: "", code: "" };
  }
};

/** The answer was cut off or failed midway. */
export const unfinishedError = () =>
  new Error(
    "The explanation did not finish. Your saved result has not changed."
  );

export const emptyReplyError = () =>
  new Error("The explanation did not finish. Try again.");

/** Base64 to bytes. */
export const decodeBase64 = (base64: string) =>
  Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));

/** The image type from its first bytes (PNG, WebP or JPEG). */
export const imageBlob = (bytes: Uint8Array) => {
  const mime =
    bytes[0] === 137 && bytes[1] === 80
      ? "image/png"
      : bytes[0] === 82 && bytes[1] === 73
        ? "image/webp"
        : "image/jpeg";
  return new Blob([bytes], { type: mime });
};

/** Speech text over the provider's limit is refused before any request. */
export const checkSpeechText = (text: string, limit: number) => {
  if (!text.trim()) throw new Error("There is no text to read aloud.");
  if (text.length > limit)
    throw new Error(
      `This text exceeds the speech limit of ${limit.toLocaleString("en-US")} characters.`
    );
};

/**
 * Splits speech text into pieces of at most `max` characters, at paragraph
 * breaks where it can, else after a sentence, else anywhere. Each piece is
 * spoken separately and the MP3s joined (MP3 frames play back to back).
 */
export const splitForSpeech = (text: string, max: number): string[] => {
  const pieces: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    const window = rest.slice(0, max);
    const paragraph = window.lastIndexOf("\n\n");
    const sentence = Math.max(
      ...["。", "！", "？", ". ", "! ", "? ", "\n"].map((end) => {
        const at = window.lastIndexOf(end);
        return at < 0 ? -1 : at + end.length;
      })
    );
    const cut =
      paragraph > max / 2 ? paragraph : sentence > max / 2 ? sentence : max;
    pieces.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) pieces.push(rest);
  return pieces;
};

/** A voice picked earlier can no longer be used (e.g. removed by its owner). */
export class AiVoiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiVoiceUnavailableError";
  }
}
