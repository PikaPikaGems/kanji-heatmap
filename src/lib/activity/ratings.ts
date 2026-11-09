import type {
  CardType,
  DailySummary,
  FsrsRating,
  ReviewSummary,
} from "engine-contract";
import { isDateKeyInRange } from "./dates";
import type { DateRange } from "./types";

/** Ratings in the order bars and lists show them: worst first. */
export const RATINGS: readonly FsrsRating[] = ["again", "hard", "good", "easy"];

/** What the mastery games call each rating ("Again" is the Forgot button). */
export const RATING_LABELS: Record<FsrsRating, string> = {
  again: "Forgot",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

/** A day's (or a period's) review ratings, per card type. */
export type DayRatings = Record<CardType, ReviewSummary>;

/** Local YYYY-MM-DD → that day's ratings; days without reviews are absent. */
export type RatingsByDay = Record<string, DayRatings>;

export const EMPTY_DAY_RATINGS: DayRatings = {
  reading: {},
  secondaryReading: {},
  writing: {},
};

/** Two rating tallies added together (e.g. every card type = combined). */
export const addRatings = (
  a: ReviewSummary,
  b: ReviewSummary
): ReviewSummary => ({
  again: (a.again ?? 0) + (b.again ?? 0),
  hard: (a.hard ?? 0) + (b.hard ?? 0),
  good: (a.good ?? 0) + (b.good ?? 0),
  easy: (a.easy ?? 0) + (b.easy ?? 0),
});

/** Every card type's ratings added together. */
export const combinedRatings = (ratings: DayRatings): ReviewSummary =>
  addRatings(
    addRatings(ratings.reading, ratings.secondaryReading),
    ratings.writing
  );

/** Reviews graded in total, whatever the rating. */
export const totalRatings = (summary: ReviewSummary): number =>
  RATINGS.reduce((sum, rating) => sum + (summary[rating] ?? 0), 0);

/** Daily summaries' ratings keyed by day, for the calendar. */
export const toRatingsByDay = (summaries: DailySummary[]): RatingsByDay =>
  Object.fromEntries(
    summaries.map((summary) => [
      summary.summaryDate,
      {
        reading: summary.reviews.reading,
        secondaryReading: summary.reviews.secondaryReading,
        writing: summary.reviews.writing,
      },
    ])
  );

/** Every rating in `range`, added up per card type. */
export const ratingsInRange = (
  byDay: RatingsByDay,
  range: DateRange
): DayRatings => {
  let total = EMPTY_DAY_RATINGS;
  for (const [key, day] of Object.entries(byDay)) {
    if (!isDateKeyInRange(key, range)) continue;
    total = {
      reading: addRatings(total.reading, day.reading),
      secondaryReading: addRatings(
        total.secondaryReading,
        day.secondaryReading
      ),
      writing: addRatings(total.writing, day.writing),
    };
  }
  return total;
};
