import type { ActivityRecordInput } from "@/lib/engine/use-activity-recorder";
import { isFillTheKanjiActivityType } from "@/lib/fill-the-kanji/activity";
import {
  fillTheKanjiPageMeta,
  productionPracticePageMeta,
  recognitionPractice2PageMeta,
  recognitionPracticePageMeta,
} from "@/lib/pages/practice-pages";

/**
 * The engine generic-challenge activity type of each practice game. Practice
 * has no sets, so every round is challenge 1.
 */
export type PracticeActivityType =
  | "reading_practice"
  | "secondary_reading_practice"
  | "writing_practice";

const PRACTICE_CHALLENGE_ID = 1;

/** The engine record for a finished practice round. */
export const practiceRoundRecord = (
  activityType: PracticeActivityType
): ActivityRecordInput => ({
  type: "generic_challenge_completed",
  activityType,
  challengeId: PRACTICE_CHALLENGE_ID,
});

const PRACTICE_ACTIVITY_LABELS: Record<PracticeActivityType, string> = {
  reading_practice: recognitionPracticePageMeta.shortLabel,
  secondary_reading_practice: recognitionPractice2PageMeta.shortLabel,
  writing_practice: productionPracticePageMeta.shortLabel,
};

/** The game an engine generic activity type was recorded by, if the app knows it. */
export const practiceActivityLabel = (
  activityType: string
): string | undefined => {
  if (isFillTheKanjiActivityType(activityType)) {
    return fillTheKanjiPageMeta.shortLabel;
  }
  return PRACTICE_ACTIVITY_LABELS[activityType as PracticeActivityType];
};
