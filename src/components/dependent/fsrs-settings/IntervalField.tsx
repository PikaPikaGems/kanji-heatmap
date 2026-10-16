import { Slider } from "@/components/ui/slider";
import { clamp } from "@/lib/utils";
import { FieldError, FieldTitle, SliderEnds, Warning } from "./FieldParts";

const DAYS_PER_MONTH = 30;
const MAX_MONTHS = 60;
const WARN_ABOVE_MONTHS = 14;

const describeMonths = (months: number, days: number) =>
  months < 24
    ? `${months} ${months === 1 ? "month" : "months"}`
    : `${months} months (~${Math.round(days / 365)} years)`;

/**
 * "Maximum interval" slider: shown in months, stored as `maximumIntervalDays`.
 * A saved value above the slider's range (the engine default is 100 years)
 * keeps its own label and puts the thumb at the end; it only changes when the
 * slider moves.
 */
export const IntervalField = ({
  days,
  onChange,
  error,
}: {
  days: number;
  onChange: (days: number) => void;
  error: string | undefined;
}) => {
  const months = Math.max(1, Math.round(days / DAYS_PER_MONTH));

  return (
    <div className="flex flex-col gap-2">
      <FieldTitle
        title="Maximum interval"
        tip="The longest gap allowed between two reviews of the same card."
        value={describeMonths(months, days)}
      />
      <Slider
        min={1}
        max={MAX_MONTHS}
        step={1}
        value={[clamp(months, 1, MAX_MONTHS)]}
        onValueChange={(values) => onChange(values[0] * DAYS_PER_MONTH)}
        thumbLabel="Maximum interval"
      />
      <SliderEnds min="1 month" max={`${MAX_MONTHS / 12} years`} />
      {months > WARN_ABOVE_MONTHS && (
        <Warning>
          {`Setting the maximum interval above ${WARN_ABOVE_MONTHS} months can create very long gaps between reviews, increasing the risk of forgetting.`}
        </Warning>
      )}
      <FieldError message={error} />
    </div>
  );
};
