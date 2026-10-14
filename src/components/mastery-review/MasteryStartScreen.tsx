import type { CardType } from "engine-contract";
import { PracticeButton } from "@/components/ui/practice-button";
import { Stat } from "@/components/shared-practice";
import { LeavePractice } from "@/components/shared-practice/EndSessionButton";
import { useEnterAction } from "@/hooks/use-enter-action";
import { useDueCount } from "@/lib/engine/use-due-count";
import { nextDueCopy } from "./next-due-copy";
import { useNextDueAt } from "./use-next-due-at";

/** Start screen of a mastery game: how many cards are due, then Start. */
export const MasteryStartScreen = ({
  heading,
  description,
  cardType,
  ready,
  blocker,
  error,
  onStart,
}: {
  heading: string;
  description: string;
  cardType: CardType;
  /** The card data (words, readings) has loaded. */
  ready: boolean;
  /** Why reviewing can't start, shown instead of the Start hint. */
  blocker: string | null;
  /** The last attempt to fetch the round failed. */
  error?: string;
  onStart: () => void;
}) => {
  const due = useDueCount()?.[cardType] ?? null;
  const nextDueAt = useNextDueAt(cardType);
  const canStart = ready && blocker == null && due != null && due > 0;

  useEnterAction(canStart ? onStart : null, canStart);

  return (
    <div className="relative flex flex-col h-full">
      <LeavePractice />
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex flex-col items-center justify-center max-w-md min-h-full gap-6 px-4 py-6 mx-auto text-center">
          <div>
            <h1 className="text-xl font-bold">{heading}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          {due == null && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {due != null && due > 0 && (
            <Stat value={due} unit="" label="Due now" />
          )}
          {due === 0 && (
            <p className="text-sm font-bold">{nextDueCopy(nextDueAt)}</p>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t-4 border-dotted rounded-3xl bg-background">
        <div className="flex flex-col w-full max-w-md gap-2 mx-auto">
          {(blocker ?? error) && (
            <p
              className="text-sm text-left text-muted-foreground"
              role="status"
            >
              {blocker ?? error}
            </p>
          )}
          <PracticeButton size="lg" disabled={!canStart} onClick={onStart}>
            Start
          </PracticeButton>
        </div>
      </div>
    </div>
  );
};
