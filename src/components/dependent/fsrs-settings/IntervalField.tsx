import { Slider } from "@/components/ui/slider";
import { FieldError, FieldTitle, Warning } from "./FieldParts";

const DAYS_PER_MONTH = 30;
const MAX_DAYS = 36500;
const MAX_MONTHS = Math.ceil(MAX_DAYS / DAYS_PER_MONTH);
const WARN_ABOVE_MONTHS = 36;

const stopSize = (month: number) => {
  if (month < 12) return 1;
  if (month < 36) return 3;
  if (month < 60) return 6;
  if (month < 120) return 12;
  if (month < 360) return 60;
  return 240;
};

/**
 * Month values the slider can land on. A linear slider can't cover one month
 * to a hundred years (the engine default) and still be usable, so the steps get
 * wider as the interval grows; every step changes the value.
 */
const MONTH_STOPS = (() => {
  const stops: number[] = [];
  for (let month = 1; month < MAX_MONTHS; month += stopSize(month)) {
    stops.push(month);
  }
  stops.push(MAX_MONTHS);
  return stops;
})();

const nearestStopIndex = (months: number) => {
  let best = 0;
  for (let index = 1; index < MONTH_STOPS.length; index++) {
    if (
      Math.abs(MONTH_STOPS[index] - months) <
      Math.abs(MONTH_STOPS[best] - months)
    ) {
      best = index;
    }
  }
  return best;
};

const describeMonths = (months: number, days: number) =>
  months < 24
    ? `${months} ${months === 1 ? "month" : "months"}`
    : `${months} months (~${Math.round(days / 365)} years)`;

/** "Maximum interval" slider: shown in months, stored as `maximumIntervalDays`. */
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
        min={0}
        max={MONTH_STOPS.length - 1}
        step={1}
        value={[nearestStopIndex(months)]}
        onValueChange={(values) =>
          onChange(Math.min(MAX_DAYS, MONTH_STOPS[values[0]] * DAYS_PER_MONTH))
        }
        thumbLabel="Maximum interval"
      />
      {months > WARN_ABOVE_MONTHS && (
        <Warning>
          Setting the maximum interval above 36 months can create very long gaps
          between reviews, increasing the risk of forgetting.
        </Warning>
      )}
      <FieldError message={error} />
    </div>
  );
};
