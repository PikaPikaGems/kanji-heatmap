import { useMemo } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { useEnterAction } from "@/hooks/use-enter-action";
import { pickEndCheer } from "@/lib/practice-cheers";
import { Stat } from "@/components/shared-practice";
import { SessionStats } from "./types";
import { SpeedKatakanaStatsSummary } from "./SpeedKatakanaStatsSummary";

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
