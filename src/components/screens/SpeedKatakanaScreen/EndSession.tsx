import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SessionStats } from "./types";

const COUNT_UP_MS = 900;

/** Animates from 0 up to `target` over COUNT_UP_MS once on mount. */
const useCountUp = (target: number) => {
  const [value, setValue] = useState(0);

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

const Stat = ({
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
    <div className="flex flex-col items-center gap-1">
      <div className="text-5xl font-bold tabular-nums sm:text-6xl">
        {animated}
        <span className="ml-1 text-2xl font-semibold text-muted-foreground">
          {unit}
        </span>
      </div>
      <div className="text-xs font-bold uppercase text-muted-foreground ">{label}</div>
    </div>
  );
};

export const EndSession = ({
  stats,
  onNext,
  onEnd,
  completedSets,
  totalSets,
}: {
  stats: SessionStats;
  onNext: () => void;
  onEnd: () => void;
  completedSets: number;
  totalSets: number;
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-10">
      <h2 className="text-2xl font-bold">Challenge complete!</h2>

      <p className="text-sm">
        <span className="font-semibold">{completedSets}</span>
        {" / "}{totalSets} sets completed
        ({Math.round((completedSets / totalSets) * 100)}%)
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">
        <Stat value={stats.accuracy} unit="%" label="Accuracy" />
        <Stat
          value={stats.charsPerMinute}
          unit="cpm"
          label="Characters / Minute"
        />
      </div>

      <div className="flex flex-col w-full max-w-xs gap-3">
        <Button size="lg" className="w-full" onClick={onNext}>
          Next Challenge
        </Button>
        <Button variant="ghost" size="lg" className="w-full text-foreground" onClick={onEnd}>
          End Session
        </Button>
      </div>
    </div>
  );
};
