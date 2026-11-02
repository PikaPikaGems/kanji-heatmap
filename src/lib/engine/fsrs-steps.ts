import { safeReadJson } from "@/lib/storage";

/**
 * Learning / relearning step helpers for the FSRS settings form (design 5.6).
 * The engine accepts at most 10 whole-minute steps from 1 to 1439
 * (host/api/REVIEWS.md "Step arrays"). Order and the 16 hour recommendation
 * are host advice (host/guide/REVIEWS.md), so they only produce warnings.
 */
export const MAX_STEP_COUNT = 10;
export const MAX_STEP_MINUTES = 1439;
const RECOMMENDED_MAX_STEP_MINUTES = 960;

export type StepPreset = { id: string; label: string; steps: number[] };

export const LEARNING_PRESETS: StepPreset[] = [
  { id: "standard", label: "Standard", steps: [1, 10] },
  { id: "aggressive", label: "Aggressive", steps: [1, 10, 60] },
  { id: "minimal", label: "Minimal", steps: [10] },
];

export const RELEARNING_PRESETS: StepPreset[] = [
  { id: "standard", label: "Standard", steps: [10] },
  { id: "aggressive", label: "Aggressive", steps: [5, 30] },
  { id: "minimal", label: "Minimal", steps: [5] },
];

const formatStep = (minutes: number) =>
  minutes % 60 === 0 ? `${minutes / 60}h` : `${minutes}m`;

/** `[1, 10, 60]` as `"1m, 10m, 1h"`. */
export const formatSteps = (steps: readonly number[]) =>
  steps.map(formatStep).join(", ");

export const sameSteps = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((step, index) => step === b[index]);

export type ParsedSteps =
  | { ok: true; steps: number[] }
  | { ok: false; error: string };

const STEP_PATTERN = /^(\d+)\s*([mh])?$/i;

/** Parses `"1m, 10m, 1h"` (a bare number means minutes) into minutes. */
export const parseSteps = (text: string): ParsedSteps => {
  const tokens = text
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token !== "");
  if (tokens.length === 0) {
    return { ok: false, error: "Enter at least one step." };
  }
  if (tokens.length > MAX_STEP_COUNT) {
    return { ok: false, error: `Use at most ${MAX_STEP_COUNT} steps.` };
  }

  const steps: number[] = [];
  for (const token of tokens) {
    const match = STEP_PATTERN.exec(token);
    if (!match) {
      return {
        ok: false,
        error: `"${token}" isn't a valid step. Use whole numbers with m or h, like 10m or 1h.`,
      };
    }
    const minutes =
      Number(match[1]) * (match[2]?.toLowerCase() === "h" ? 60 : 1);
    if (minutes < 1 || minutes > MAX_STEP_MINUTES) {
      return {
        ok: false,
        error: `"${token}" is out of range. Steps can be from 1m to 23h 59m.`,
      };
    }
    steps.push(minutes);
  }
  return { ok: true, steps };
};

/** Advice, not validation: the engine accepts these. */
export const stepWarnings = (steps: readonly number[]): string[] => {
  const warnings: string[] = [];
  if (steps.some((step, index) => index > 0 && step <= steps[index - 1])) {
    warnings.push(
      "Steps usually work best when each one is longer than the one before."
    );
  }
  if (steps.some((step) => step > RECOMMENDED_MAX_STEP_MINUTES)) {
    warnings.push("Steps longer than 16 hours aren't recommended.");
  }
  return warnings;
};

/**
 * The engine doesn't keep step arrays while "Enable short term" is off, so the
 * form remembers the last ones here to restore when it goes back on
 * (host/guide/REVIEWS.md "Learning steps and the host toggle").
 */
const SAVED_STEPS_KEY = "kh-fsrs-saved-steps";

type SavedSteps = { learning: number[]; relearning: number[] };

const isStepArray = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.length <= MAX_STEP_COUNT &&
  value.every(
    (step) => Number.isInteger(step) && step >= 1 && step <= MAX_STEP_MINUTES
  );

export const readSavedSteps = (): Partial<SavedSteps> => {
  const saved = safeReadJson<Record<string, unknown> | null>(
    SAVED_STEPS_KEY,
    null
  );
  return {
    learning: isStepArray(saved?.learning) ? saved.learning : undefined,
    relearning: isStepArray(saved?.relearning) ? saved.relearning : undefined,
  };
};

export const writeSavedSteps = (steps: SavedSteps) => {
  try {
    localStorage.setItem(SAVED_STEPS_KEY, JSON.stringify(steps));
  } catch {
    // Storage can be unavailable (private mode); the presets are used then.
  }
};
