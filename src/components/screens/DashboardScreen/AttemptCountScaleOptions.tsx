import { useId } from "react";
import {
  ATTEMPT_COUNT_SCALE_LABELS,
  ATTEMPT_COUNT_SCALES,
} from "@/lib/activity";
import { useAttemptCountScale } from "@/hooks/use-attempt-count-scale";

/** Popover section: how attempt counts map to cell brightness. */
export const AttemptCountScaleOptions = () => {
  const [scale, setScale] = useAttemptCountScale();
  const groupName = useId();
  const idPrefix = useId();

  return (
    <div>
      <div className="mb-3 text-xs font-extrabold uppercase text-muted-foreground">
        Attempt count brightness
      </div>
      <div className="flex flex-wrap justify-center">
        {ATTEMPT_COUNT_SCALES.map((option) => {
          const inputId = `${idPrefix}-${option}`;
          return (
            <div key={option} className="flex mx-2 mt-1.5 space-x-2">
              <input
                type="radio"
                id={inputId}
                name={groupName}
                checked={scale === option}
                onChange={() => setScale(option)}
                className="w-4 h-4 shrink-0 accent-primary"
              />
              <label
                htmlFor={inputId}
                className="text-xs font-medium leading-none translate-y-0.5"
              >
                {ATTEMPT_COUNT_SCALE_LABELS[option]}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
