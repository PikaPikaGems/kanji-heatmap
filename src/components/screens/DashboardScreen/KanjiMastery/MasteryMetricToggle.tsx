import { useId } from "react";
import {
  MASTERY_METRIC_TITLES,
  MASTERY_METRICS,
  type MasteryMetric,
} from "@/lib/engine/mastery-metrics";

/** Mastery / Stability / Difficulty as a small pill of radios (the JLPT / Jouyou switch has only two sides). */
export const MasteryMetricToggle = ({
  value,
  onChange,
}: {
  value: MasteryMetric;
  onChange: (metric: MasteryMetric) => void;
}) => {
  const name = useId();

  return (
    <div
      role="radiogroup"
      aria-label="Kanji mastery metric"
      className="inline-flex items-center gap-0.5 p-0.5 text-xs border rounded-full border-border bg-muted/70 text-muted-foreground"
    >
      {MASTERY_METRICS.map((metric) => (
        <label key={metric} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            className="sr-only peer"
            checked={metric === value}
            onChange={() => onChange(metric)}
          />
          <span className="block px-3 py-1 transition-colors rounded-full peer-checked:bg-background peer-checked:font-semibold peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
            {MASTERY_METRIC_TITLES[metric]}
          </span>
        </label>
      ))}
    </div>
  );
};
