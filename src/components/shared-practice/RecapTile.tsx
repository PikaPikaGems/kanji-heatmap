import type { FsrsRating } from "engine-contract";
import { GlobalKanjiLink } from "@/components/dependent/routing";
import { RATING_BORDER } from "./rating-border";

/**
 * Compact recap tile for practice end screens. In a mastery game the border
 * shows the rating the card got instead of right / wrong.
 */
export const RecapTile = ({
  kanji,
  keyword,
  correct,
  rating,
}: {
  kanji: string;
  keyword: string;
  correct: boolean;
  rating?: FsrsRating;
}) => {
  return (
    <div
      className={
        rating
          ? `relative rounded-xl border-2 border-dotted ${RATING_BORDER[rating]}`
          : `relative rounded-xl border border-dashed ${
              correct ? "border-foreground" : " "
            }`
      }
      title={rating}
    >
      <GlobalKanjiLink kanji={kanji} keyword={keyword} fontSize="text-4xl" />
    </div>
  );
};
