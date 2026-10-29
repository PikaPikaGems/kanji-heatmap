import { Slider } from "@/components/ui/slider";
import { MASTERED_MIN_DAYS } from "@/lib/engine/mastery-metrics";
import { clamp } from "@/lib/utils";
import { FieldError, FieldTitle, SliderEnds, Warning } from "./FieldParts";
import { DAYS_PER_MONTH } from "./interval-limits";

const WARN_ABOVE_MONTHS = 14;
const WARN_BELOW_MONTHS = 6;

const describeMonths = (months: number, days: number) =>
  months < 24
    ? `${months} ${months === 1 ? "month" : "months"}`
    : `${months} months (~${Math.round(days / 365)} years)`;

/** The slider's last stop as a short label: "5 years", "1 year", "9 months". */
const describeEnd = (months: number) => {
  if (months % 12 !== 0) return `${months} months`;
  const years = months / 12;
  return `${years} ${years === 1 ? "year" : "years"}`;
};

/**
 * "Maximum interval" slider: shown in months, stored as `maximumIntervalDays`.
 * Its range ends at `maxMonths`; a value above it is shown at the end.
 */
export const IntervalField = ({
  days,
  maxMonths,
  onChange,
  error,
}: {
  days: number;
  maxMonths: number;
  onChange: (days: number) => void;
  error: string | undefined;
}) => {
  const months = clamp(Math.round(days / DAYS_PER_MONTH), 1, maxMonths);

  return (
    <div className="flex flex-col gap-2">
      <FieldTitle
        title="Maximum interval"
        tip="The longest gap allowed between two reviews of the same card."
        value={describeMonths(months, days)}
      />
      <Slider
        min={1}
        max={maxMonths}
        step={1}
        value={[months]}
        onValueChange={(values) => onChange(values[0] * DAYS_PER_MONTH)}
        thumbLabel="Maximum interval"
      />
      <SliderEnds min="1 month" max={describeEnd(maxMonths)} />
      {months > WARN_ABOVE_MONTHS && (
        <Warning>
          {`Setting the maximum interval above ${WARN_ABOVE_MONTHS} months can create very long gaps between reviews, increasing the risk of forgetting.`}
        </Warning>
      )}
      {months < WARN_BELOW_MONTHS && (
        <Warning>
          {`A maximum interval under ${WARN_BELOW_MONTHS} months keeps bringing back cards you already know well. That's extra reviews for little gain, and it works against what FSRS is for: spacing reviews out as your memory gets stronger.`}
        </Warning>
      )}
      {months * DAYS_PER_MONTH < MASTERED_MIN_DAYS && (
        <Warning>
          {`Under ${Math.ceil(MASTERED_MIN_DAYS / DAYS_PER_MONTH)} months, no card can ever be marked Mastered: that needs its next review ${MASTERED_MIN_DAYS}+ days out.`}
        </Warning>
      )}
      <FieldError message={error} />
    </div>
  );
};
