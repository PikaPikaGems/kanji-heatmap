/** Shared DaKanji grade copy for writing practice + production quiz. */

export type GradeResult = {
  /** 0-based index in top-10, or -1 if missing */
  rank: number;
  topGuess: string | null;
};

export type GradeBand = "awesome" | "solid" | "getting-there" | "not-quite";

export const getGradeBand = (rank: number): GradeBand => {
  if (rank === 0) return "awesome";
  if (rank >= 1 && rank <= 2) return "solid";
  if (rank >= 3) return "getting-there";
  return "not-quite";
};

/** Full message used under the writing-practice pad. */
export const gradeMessage = (kanji: string, result: GradeResult): string => {
  const { rank, topGuess } = result;
  if (rank === 0) {
    return `🎯 Awesome · That's ${kanji}`;
  }
  if (rank >= 1 && rank <= 2) {
    return topGuess
      ? `💚 Solid · Near miss — Looks a bit like ${topGuess}`
      : `💚 Solid · Near miss — keep refining`;
  }
  if (rank >= 3) {
    return topGuess
      ? `🌀 Getting there · Looks more like ${topGuess}`
      : `🌀 Getting there · Keep refining`;
  }
  return topGuess
    ? `🙈 Not quite · Looks more like ${topGuess}`
    : `🙈 Not quite · Try again`;
};

/** Short headline for the select / feedback drawers. */
export const gradeHeadline = (rank: number): string => {
  const band = getGradeBand(rank);
  if (band === "awesome") {
    return "🎯 Awesome!";
  }
  if (band === "solid") {
    return "💚 Solid · Almost perfect!";
  }
  if (band === "getting-there") {
    return "🌀 Getting there";
  }
  // "not-quite"
  return "🙈 Not quite";
};

/**
 * Title for the feedback drawer after the user picks (or forgot).
 * "correct" = they selected the right kanji (drawing grade may still be not-quite).
 */
export const feedbackTitle = (
  variant: "correct" | "incorrect",
  rank: number
): string => {
  if (variant === "incorrect") {
    return "Not quite — here is the correct kanji";
  }
  const band = getGradeBand(rank);
  if (band === "awesome") {
    return "🎯 Awesome!";
  }
  if (band === "solid") {
    return "💚 Solid!";
  }
  if (band === "getting-there") {
    return "🌀 Getting there!";
  }
  // "not-quite"
  // Right kanji picked, but drawing wasn't in the model top-10.
  return "🎉 That's the one!";
};
