import { useMemo } from "react";
import { useEnterAction } from "@/hooks/use-enter-action";
import { pickEndCheer } from "@/lib/practice-cheers";
import { percent } from "@/lib/utils";
import { EndScreenLayout, Stat } from "@/components/shared-practice";
import { ItemResult } from "./types";

const CONTINUE_KEYS = ["Enter", " "] as const;

export const EndSession = ({
  results,
  roundLabel,
  onNext,
  onRetryMistakes,
  onEnd,
}: {
  results: ItemResult[];
  roundLabel: string;
  onNext: () => void;
  /** Replays just the missed sentences; not recorded as a round attempt. */
  onRetryMistakes: () => void;
  onEnd: () => void;
}) => {
  const cheer = useMemo(() => pickEndCheer(), []);
  const correct = results.filter((r) => r.correct).length;

  useEnterAction(onNext, true, CONTINUE_KEYS);
  useEnterAction(onEnd, true, ["Escape"]);

  return (
    <EndScreenLayout
      className="px-4"
      heading={cheer}
      subtitle={roundLabel}
      stats={
        <>
          <Stat value={correct} unit={`/${results.length}`} label="Correct" />
          <Stat
            value={percent(correct, results.length)}
            unit="%"
            label="Accuracy"
          />
        </>
      }
      afterStats={
        correct < results.length && (
          <button
            type="button"
            onClick={onRetryMistakes}
            className="text-sm font-bold underline underline-offset-4 text-muted-foreground hover:text-foreground"
          >
            Retry mistakes
          </button>
        )
      }
      primaryLabel="Next Round"
      onPrimary={onNext}
      secondaryLabel="End Session"
      onSecondary={onEnd}
    />
  );
};
