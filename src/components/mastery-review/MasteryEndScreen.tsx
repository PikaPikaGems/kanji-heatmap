import { useState } from "react";
import type { UTCTimestamp } from "engine-contract";
import { EndScreenLayout, Stat } from "@/components/shared-practice";
import { useEnterAction } from "@/hooks/use-enter-action";
import { pickEndCheer } from "@/lib/practice-cheers";
import { nextDueCopy } from "./next-due-copy";
import type { RatingTally } from "./use-mastery-session";

const CONTINUE_KEYS = ["Enter", " "] as const;

/** End of a mastery round: counts by rating, then what is due next. */
export const MasteryEndScreen = ({
  tally,
  saveError,
  due,
  nextDueAt,
  onMore,
  onDone,
}: {
  tally: RatingTally;
  /** Set when a grade could not be saved. */
  saveError: string | null;
  /** Cards still due now; null while counting. */
  due: number | null;
  nextDueAt: UTCTimestamp | null | undefined;
  onMore: () => void;
  onDone: () => void;
}) => {
  const [cheer] = useState(pickEndCheer);
  const moreDue = due != null && due > 0;

  useEnterAction(moreDue ? onMore : onDone, true, CONTINUE_KEYS);

  return (
    <EndScreenLayout
      className="px-4"
      heading={`🎉 ${cheer}`}
      subtitle="Round complete"
      stats={
        <>
          <Stat value={tally.again} unit="" label="Again" />
          <Stat value={tally.hard} unit="" label="Hard" />
          <Stat value={tally.good} unit="" label="Good" />
          <Stat value={tally.easy} unit="" label="Easy" />
        </>
      }
      afterStats={
        <div className="flex flex-col items-center gap-1 text-sm text-center text-muted-foreground">
          {saveError && (
            <p role="status">Some answers weren&apos;t saved. {saveError}</p>
          )}
          <p>{moreDue ? `${due} more due now` : nextDueCopy(nextDueAt)}</p>
        </div>
      }
      primaryLabel={moreDue ? "Review more" : "Done"}
      onPrimary={moreDue ? onMore : onDone}
      secondaryLabel={moreDue ? "Done" : undefined}
      onSecondary={moreDue ? onDone : undefined}
    />
  );
};
