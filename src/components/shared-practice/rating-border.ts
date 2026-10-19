import type { FsrsRating } from "engine-contract";

/**
 * Border color of a mastery recap tile, by the rating the card got. Matches
 * the rating button colors (Forgot rose, Hard orange, Good blue, Easy green).
 */
export const RATING_BORDER: Record<FsrsRating, string> = {
  easy: "border-green-500",
  good: "border-blue-500",
  again: "border-rose-500",
  hard: "border-orange-500",
};

/** The same rating colors as fills, for the dashboard's rating bars. */
export const RATING_FILL: Record<FsrsRating, string> = {
  easy: "bg-green-500",
  good: "bg-blue-500",
  again: "bg-rose-500",
  hard: "bg-orange-500",
};
