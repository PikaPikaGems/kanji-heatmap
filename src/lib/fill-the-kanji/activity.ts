import type { ActivityRecordInput } from "@/lib/engine/use-activity-recorder";
import type { FillTheKanjiSetId } from "./sets";

/**
 * The engine generic-challenge activity type for a set: the set id with `-`
 * as `_`, e.g. n5 → fill_the_kanji_n5, everyday-phrases-onomatopoeia →
 * fill_the_kanji_everyday_phrases_onomatopoeia. A batch's challengeId is its
 * 1-based batch number.
 */
export const fillTheKanjiActivityType = (setId: FillTheKanjiSetId): string =>
  `fill_the_kanji_${setId.replace(/-/g, "_")}`;

/** The engine record for a finished batch of a set. */
export const batchCompletedRecord = (
  setId: FillTheKanjiSetId,
  batch: number
): ActivityRecordInput => ({
  type: "generic_challenge_completed",
  activityType: fillTheKanjiActivityType(setId),
  challengeId: batch,
});
