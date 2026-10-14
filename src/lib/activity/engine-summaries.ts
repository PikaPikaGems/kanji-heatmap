import type {
  ActivityRecordSummary,
  AllTimeSummary,
  DailySummary,
  FirstAttemptsSummary,
  LocalDate,
  ReviewSummary,
} from "engine-contract";
import { isFillTheKanjiActivityType } from "@/lib/fill-the-kanji/activity";
import { emptyActivityStats } from "./queries";
import { ActivityByDay, ActivityStats, DayCounts } from "./types";

/** Reviews graded in total, whatever the rating. */
const sumReviews = (reviews: ReviewSummary): number =>
  (reviews.again ?? 0) +
  (reviews.hard ?? 0) +
  (reviews.good ?? 0) +
  (reviews.easy ?? 0);

/** Fill the Kanji batches across every set (one generic activity type per set). */
const sumFillTheKanji = (
  genericChallenges: ActivityRecordSummary["genericChallenges"]
): number =>
  Object.entries(genericChallenges)
    .filter(([activityType]) => isFillTheKanjiActivityType(activityType))
    .reduce((sum, [, count]) => sum + (count ?? 0), 0);

/** The heatmap's per-kind counts for a day's (or a period's) engine summary. */
export const toDayCounts = (summary: ActivityRecordSummary): DayCounts => ({
  recognition: summary.practice.reading,
  production: summary.practice.writing,
  fillTheKanji: sumFillTheKanji(summary.genericChallenges),
  speedKatakana: summary.practice.speedKatakana,
  readingMastery: sumReviews(summary.reviews.reading),
  writingMastery: sumReviews(summary.reviews.writing),
  newKanji: summary.reviews.newItems,
});

/** Daily summaries keyed by day, for the calendar. */
export const toActivityByDay = (summaries: DailySummary[]): ActivityByDay =>
  Object.fromEntries(
    summaries.map((summary) => [summary.summaryDate, toDayCounts(summary)])
  );

/**
 * Distinct days with Fill the Kanji activity. Per-set day counts can't be
 * summed (a day can have several sets), so this counts days across the daily
 * summaries.
 */
export const countFillTheKanjiDays = (summaries: DailySummary[]): number =>
  summaries.filter((summary) => sumFillTheKanji(summary.genericChallenges) > 0)
    .length;

/** The earliest day any Fill the Kanji set was attempted, if one was. */
export const firstFillTheKanjiDay = (
  firstAttempts: FirstAttemptsSummary
): LocalDate | undefined =>
  Object.entries(firstAttempts.genericChallenges)
    .filter(([activityType]) => isFillTheKanjiActivityType(activityType))
    .map(([, day]) => day)
    .filter((day): day is LocalDate => day != null)
    .sort()[0];

/** All-time days and counts per kind. `fillTheKanjiDays` comes from countFillTheKanjiDays. */
export const toAllTimeStats = (
  allTime: AllTimeSummary,
  fillTheKanjiDays: number
): ActivityStats => {
  const counts = toDayCounts(allTime.totals);
  const { daysActive } = allTime;
  const stats = emptyActivityStats();
  stats.daysActive = daysActive.totalDaysActive;
  stats.kinds.recognition = {
    days: daysActive.practice.reading,
    count: counts.recognition,
  };
  stats.kinds.production = {
    days: daysActive.practice.writing,
    count: counts.production,
  };
  stats.kinds.fillTheKanji = {
    days: fillTheKanjiDays,
    count: counts.fillTheKanji,
  };
  stats.kinds.speedKatakana = {
    days: daysActive.practice.speedKatakana,
    count: counts.speedKatakana,
  };
  stats.kinds.readingMastery = {
    days: daysActive.reviews.reading,
    count: counts.readingMastery,
  };
  stats.kinds.writingMastery = {
    days: daysActive.reviews.writing,
    count: counts.writingMastery,
  };
  stats.kinds.newKanji = {
    days: daysActive.reviews.newItems,
    count: counts.newKanji,
  };
  return stats;
};
