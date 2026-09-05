import { useId } from "react";
import { GenericPopover } from "@/components/common/GenericPopover";
import { Settings2 } from "@/components/icons";
import { cn } from "@/lib/utils";
import { cnDottedUnderlineTrigger } from "@/lib/generic-cn";
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
          key={metric}
          type="button"
          className={cn(
            cnDottedUnderlineTrigger,
            "animate-fade-in-slow text-xs",
            className
          )}
        >
          <strong>
            Colored by {HEATMAP_METRIC_LABELS[metric].toLowerCase()}
          </strong>
          <Settings2 size={14} />
        </button>
      }
      content={
        <div className="p-5 space-y-3 text-left">
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
      contentClassName="m-0 p-0 max-w-56"
    />
  );
};
