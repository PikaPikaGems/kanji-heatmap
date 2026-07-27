import { useId } from "react";
import { GenericPopover } from "@/components/common/GenericPopover";
import { Settings2 } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  HEATMAP_CELL_METRICS,
  HEATMAP_METRIC_LABELS,
  HeatmapCellMetric,
} from "@/lib/activity";
import { useHeatmapCellMetric } from "@/hooks/use-heatmap-cell-metric";

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
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id={inputId}
        name={name}
        checked={checked}
        onChange={() => onChange(metric)}
        className="h-4 w-4 shrink-0 accent-primary"
      />
      <label htmlFor={inputId} className="text-sm font-medium leading-none">
        {HEATMAP_METRIC_LABELS[metric]}
      </label>
    </div>
  );
};

export const SpeedKatakanaHeatmapSettingsPopover = ({
  className,
}: {
  className?: string;
}) => {
  const [metric, setMetric] = useHeatmapCellMetric();
  const groupName = useId();

  return (
    <GenericPopover
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 text-xs leading-loose underline cursor-pointer decoration-dotted underline-offset-8",
            className
          )}
        >
          <strong>Color by</strong>
          <Settings2 size={14} />
        </button>
      }
      content={
        <div className="p-5 space-y-3 text-left w-64">
          <div className="text-xs font-extrabold uppercase text-muted-foreground">
            Color cells by
          </div>
          <div className="space-y-2.5">
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
        </div>
      }
      contentClassName="m-0 w-[calc(100vw-2rem)] max-w-sm p-0"
    />
  );
};
