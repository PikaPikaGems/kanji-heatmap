import {
  FreqCategory,
  freqCategoryCn,
  freqCategoryCount,
} from "@/lib/freq/freq-category";
import { FreqSquare } from "./freq/FreqSquare";

/** Opacity-gradient legend (e.g. "Less…More", "Slow…Fast") for any heatmap. */
export const GradientLegend = ({
  lessLabel = "Less",
  moreLabel = "More",
}: {
  lessLabel?: string;
  moreLabel?: string;
} = {}) => {
  return (
    <div
      className="flex items-center w-full my-3 space-x-1 animate-fade-in"
      key={lessLabel + moreLabel}
    >
      <div className="text-xs">{lessLabel}</div>
      {Array.from({ length: freqCategoryCount }).map((_, item) => {
        const cn = freqCategoryCn[item as FreqCategory];
        return <FreqSquare key={item} srOnly={item.toString()} cn={cn} />;
      })}
      <div className="text-xs">{moreLabel}</div>
    </div>
  );
};
