import type { ActiveReview, FsrsRating } from "engine-contract";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_DAYS = 30;

/** Short interval label: 5m, 3h, 12d, 4mo. Never shorter than 1m. */
export const formatInterval = (ms: number): string => {
  const minutes = Math.max(1, Math.round(ms / MINUTE_MS));
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.round(ms / HOUR_MS);
  if (hours < 24) return `${hours}h`;

  const days = Math.round(ms / DAY_MS);
  if (days < MONTH_DAYS) return `${days}d`;

  return `${Math.max(1, Math.round(days / MONTH_DAYS))}mo`;
};

/**
 * The frozen next-review interval of each rating for an open review
 * (`scheduledAt - openedAt`, host/api/REVIEWS.md), as short labels.
 */
export const ratingIntervalLabels = (
  review: ActiveReview
): Record<FsrsRating, string> => {
  const label = (rating: FsrsRating) =>
    formatInterval(
      Date.parse(review.previews[rating].scheduledAt) - review.openedAt
    );
  return {
    again: label("again"),
    hard: label("hard"),
    good: label("good"),
    easy: label("easy"),
  };
};
