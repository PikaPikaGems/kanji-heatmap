import { useEffect, useMemo, useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { useEnterAction } from "@/hooks/use-enter-action";
import { pickEndCheer } from "@/lib/practice-cheers";
import { SessionStats } from "./types";
import { SpeedKatakanaStatsSummary } from "./SpeedKatakanaStatsSummary";

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
    <div className="flex flex-col items-center gap-1 animate-practice-tile-in">
      <div className="text-5xl font-bold tabular-nums sm:text-6xl">
        {animated}
        <span className="ml-1 text-2xl font-semibold text-muted-foreground">
          {unit}
        </span>
      </div>
      <div className="text-xs font-bold uppercase text-muted-foreground ">
        {label}
      </div>
    </div>
  );
};

export const EndSession = ({
  stats,
  onNext,
  onEnd,
  completedSets,
}: {
  stats: SessionStats;
  onNext: () => void;
  onEnd: () => void;
  completedSets: number;
}) => {
  const cheer = useMemo(() => pickEndCheer(), []);
  useEnterAction(onNext);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-10 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold kanji-font animate-practice-bounce-soft">
          {cheer}
        </h2>
        <p className="mt-1 text-xs font-bold tracking-wide uppercase text-muted-foreground">
          Challenge complete
        </p>
        <div className="mt-2">
          <SpeedKatakanaStatsSummary completed={completedSets} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center pb-4 gap-x-16">
        <Stat value={stats.accuracy} unit="%" label="Accuracy" />
        <Stat
          value={stats.charsPerMinute}
          unit="cpm"
          label="Characters / Minute"
        />
      </div>

      <div className="flex flex-col w-full max-w-xs gap-3">
        <PracticeButton size="lg" onClick={onNext}>
          Next Challenge
        </PracticeButton>
        <PracticeButton variant="ghost" size="md" onClick={onEnd}>
          End Session
        </PracticeButton>
      </div>
    </div>
  );
};
