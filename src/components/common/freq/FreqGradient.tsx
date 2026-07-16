import {
  FreqCategory,
  freqCategoryCn,
  freqCategoryCount,
} from "@/lib/freq/freq-category";
import { FreqSquare } from "./FreqSquare";

export const FreqGradient = ({
  lessLabel = "Less",
  moreLabel = "More",
}: {
  lessLabel?: string;
  moreLabel?: string;
} = {}) => {
  return (
    <div className="flex my-3 space-x-1 items-center w-full">
      <div className="text-xs">{lessLabel}</div>
      {Array.from({ length: freqCategoryCount }).map((_, item) => {
        const cn = freqCategoryCn[item as FreqCategory];
        return <FreqSquare key={item} srOnly={item.toString()} cn={cn} />;
      })}
      <div className="text-xs">{moreLabel}</div>
    </div>
  );
};
