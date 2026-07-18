import { useMemo } from "react";
import { useEnterAction } from "@/hooks/use-enter-action";
import { pickEndCheer } from "@/lib/practice-cheers";
import { EndScreenLayout, Stat } from "@/components/shared-practice";
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
  useEnterAction(onEnd, true, ["Escape"]);

  return (
    <EndScreenLayout
      heading={cheer}
      subtitle="Challenge complete"
      headingExtra={
        <div className="mt-2">
          <SpeedKatakanaStatsSummary completed={completedSets} />
        </div>
      }
      stats={
        <>
          <Stat value={stats.accuracy} unit="%" label="Accuracy" />
          <Stat
            value={stats.charsPerMinute}
            unit="cpm"
            label="Characters / Minute"
          />
        </>
      }
      primaryLabel="Next Challenge"
      onPrimary={onNext}
      secondaryLabel="End Session"
      onSecondary={onEnd}
    />
  );
};
