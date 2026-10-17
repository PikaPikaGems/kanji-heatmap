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
