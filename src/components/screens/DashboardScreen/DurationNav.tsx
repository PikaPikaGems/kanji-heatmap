import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DurationOption,
  canGoNextDuration,
  canGoPrevDuration,
  durationOptionLabel,
  shiftDuration,
} from "@/lib/activity";
import { cn } from "@/lib/utils";

export const DurationNav = ({
  value,
  onChange,
}: {
  value: DurationOption;
  onChange: (next: DurationOption) => void;
}) => {
  const canGoPrev = canGoPrevDuration(value);
  const canGoNext = canGoNextDuration(value);

  const go = (delta: -1 | 1) => {
    const next = shiftDuration(value, delta);
    if (next) onChange(next);
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={!canGoPrev}
        className={cn(
          "flex size-9 items-center justify-center rounded-xl bg-background",
          "transition-[transform,border-width] active:translate-y-[2px] active:border-b-2",
          "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-30 disabled:active:translate-y-0"
        )}
        aria-label="Previous period"
      >
        <ChevronLeft className="size-5" />
      </button>
      <div className="min-w-[9.5rem] text-center text-base font-extrabold tabular-nums">
        {durationOptionLabel(value)}
      </div>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={!canGoNext}
        className={cn(
          "flex size-9 items-center justify-center rounded-xl bg-background",
          "transition-[transform,border-width] active:translate-y-[2px] active:border-b-2",
          "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-30 disabled:active:translate-y-0"
        )}
        aria-label="Next period"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
};
