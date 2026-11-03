import { Slider } from "@/components/ui/slider";
import { clamp } from "@/lib/utils";
import { FieldError, FieldTitle, SliderEnds, Warning } from "./FieldParts";

// The engine accepts anything in (0, 1]; these are the slider's own bounds.
const MIN_PERCENT = 50;
const MAX_PERCENT = 99;
const WARN_ABOVE = 0.92;
const WARN_BELOW = 0.7;

/** "Request retention" slider, shown as a percentage. */
export const RetentionField = ({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (value: number) => void;
  error: string | undefined;
}) => {
  const percent = Number((value * 100).toFixed(1));

  return (
    <div className="flex flex-col gap-2">
      <FieldTitle
        title="Request retention"
        tip="How likely you want to be to remember a card when it comes up for review. Higher means more reviews."
        value={`${percent}%`}
      />
      <Slider
        min={MIN_PERCENT}
        max={MAX_PERCENT}
        step={1}
        value={[clamp(Math.round(percent), MIN_PERCENT, MAX_PERCENT)]}
        onValueChange={(values) => onChange(values[0] / 100)}
        thumbLabel="Request retention"
      />
      <SliderEnds min={`${MIN_PERCENT}%`} max={`${MAX_PERCENT}%`} />
      {value > WARN_ABOVE && (
        <Warning>
          Above 92% retention will significantly increase your daily workload
          and may reduce the efficiency of spaced repetition.
        </Warning>
      )}
      {value < WARN_BELOW && (
        <Warning>
          Below 70% retention you&apos;ll have fewer reviews, but you&apos;ll
          forget many more cards before they come back. Missing that often can
          feel discouraging, and forgotten cards need relearning.
        </Warning>
      )}
      <FieldError message={error} />
    </div>
  );
};
