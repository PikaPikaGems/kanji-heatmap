import type { FsrsRating } from "engine-contract";

/** Border color of a mastery recap tile, by the rating the card got. */
export const RATING_BORDER: Record<FsrsRating, string> = {
  easy: "border-green-500",
  good: "border-blue-500",
  again: "border-red-500",
  hard: "border-yellow-500",
};
