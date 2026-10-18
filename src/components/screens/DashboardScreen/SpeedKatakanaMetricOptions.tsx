import { useId } from "react";
import {
  HEATMAP_CELL_METRICS,
  HEATMAP_METRIC_LABELS,
  HeatmapCellMetric,
} from "@/lib/activity";
import { useHeatmapCellMetric } from "@/hooks/use-heatmap-cell-metric";
import { AttemptCountScaleOptions } from "./AttemptCountScaleOptions";

const MetricRadioOption = ({
  name,
  metric,
  checked,
  onChange,
}: {
  name: string;
  metric: HeatmapCellMetric;
  checked: boolean;
  onChange: (metric: HeatmapCellMetric) => void;
}) => {
  const inputId = useId();
  return (
    <div className="flex space-x-2">
      <input
        type="radio"
        id={inputId}
        name={name}
        checked={checked}
        onChange={() => onChange(metric)}
        className="w-4 h-4 shrink-0 accent-primary"
      />
      <label
        htmlFor={inputId}
        className="text-xs font-medium leading-none translate-y-0.5"
      >
        {HEATMAP_METRIC_LABELS[metric]}
      </label>
    </div>
  );
};

/**
 * What colors the Speed Katakana cells, as a row of radio options right
 * under the grid (above its legend), plus the attempt-count scale when
 * Attempt count is picked.
 */
export const SpeedKatakanaMetricOptions = () => {
  const [metric, setMetric] = useHeatmapCellMetric();
  const groupName = useId();

  return (
    <fieldset className="flex flex-col items-center gap-3 mt-5">
      <legend className="mb-3 text-xs font-extrabold text-center uppercase text-muted-foreground">
        Color cells by
      </legend>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2.5">
        {HEATMAP_CELL_METRICS.map((option) => (
          <MetricRadioOption
            key={option}
            name={groupName}
            metric={option}
            checked={metric === option}
            onChange={setMetric}
          />
        ))}
      </div>
      {metric === "attemptCount" && (
        <div className="pt-3 border-t border-dotted animate-fade-in-fast">
          <AttemptCountScaleOptions />
        </div>
      )}
    </fieldset>
  );
};
