/** FSRS model weights: exactly 21 finite numbers (host/api/REVIEWS.md). */
export const MODEL_WEIGHT_COUNT = 21;

export const formatWeights = (weights: readonly number[]) =>
  `[${weights.join(", ")}]`;

export type ParsedWeights =
  | { ok: true; weights: number[] }
  | { ok: false; error: string };

/** Accepts a JSON-ish list: optional brackets, commas and/or whitespace. */
export const parseWeights = (text: string): ParsedWeights => {
  const tokens = text
    .replace(/^\s*\[/, "")
    .replace(/\]\s*$/, "")
    .split(/[\s,]+/)
    .filter((token) => token !== "");

  const weights: number[] = [];
  for (const token of tokens) {
    const weight = Number(token);
    if (!Number.isFinite(weight)) {
      return { ok: false, error: `"${token}" isn't a number.` };
    }
    weights.push(weight);
  }
  if (weights.length !== MODEL_WEIGHT_COUNT) {
    return {
      ok: false,
      error: `Enter exactly ${MODEL_WEIGHT_COUNT} numbers (found ${weights.length}).`,
    };
  }
  return { ok: true, weights };
};
