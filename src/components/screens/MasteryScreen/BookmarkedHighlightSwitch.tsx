import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SquareListItem } from "@/components/common/SquareListItem";
import {
  BOOKMARKED_FILL_CN,
  useHighlightBookmarked,
} from "./use-heatmap-metric";

/**
 * Bookmarks often mean "I already know this one", so this paints them solid
 * over the mastery colors: known (bookmarked) vs mastered vs still learning.
 */
export const BookmarkedHighlightSwitch = () => {
  const id = useId();
  const [highlight, setHighlight] = useHighlightBookmarked();

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <Switch id={id} checked={highlight} onCheckedChange={setHighlight} />
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          Highlight bookmarked kanji
        </Label>
      </div>
      {highlight && (
        <ul className="flex flex-wrap my-2 animate-fade-in-fast">
          <SquareListItem
            cn={`${BOOKMARKED_FILL_CN.bookmarked} m-1 pr-2`}
            color="green"
            label="Bookmarked"
          />
          <SquareListItem
            cn={`${BOOKMARKED_FILL_CN.reviewing} m-1 pr-2`}
            color="lime"
            label="Bookmarked & Reviewing"
          />
        </ul>
      )}
    </div>
  );
};
