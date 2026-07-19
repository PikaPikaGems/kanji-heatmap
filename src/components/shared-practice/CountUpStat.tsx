import { useEffect, useState } from "react";

const COUNT_UP_MS = 900;

/** Animates from 0 up to `target` over COUNT_UP_MS once on mount. */
const useCountUp = (target: number) => {
  const [value, setValue] = useState(0);

  // Effect needed: requestAnimationFrame loop driving the count-up,
  // cancelled on unmount/target change.
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / COUNT_UP_MS, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
};

/** A single count-up stat tile (big number + optional unit + label). */
export const Stat = ({
  value,
  unit,
  label,
}: {
  value: number;
  unit: string;
  label: string;
}) => {
  const animated = useCountUp(value);
  return (
    <div className="flex flex-col items-center gap-1 animate-practice-tile-in">
      <div className="text-5xl font-bold tabular-nums sm:text-6xl">
        {animated}
        {unit ? (
          <span className="ml-1 text-2xl font-semibold text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
      <div className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </div>
    </div>
  );
};
