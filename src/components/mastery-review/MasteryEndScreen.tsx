import { useState } from "react";
import type { CardType } from "engine-contract";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { RoundRecap } from "@/components/shared-practice";
import { useEnterAction } from "@/hooks/use-enter-action";
import { useOpenedParam, useSetOpenedParam } from "@/hooks/routing-hooks";
import { pickEndCheer } from "@/lib/practice-cheers";
import { nextDueCopy } from "./next-due-copy";
import type { MasteryResult, SaveFailure } from "./use-mastery-session";
import { UnsavedAnswersDialog } from "./UnsavedAnswersDialog";
import { useNextDueAt } from "./use-next-due-at";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

const CONTINUE_KEYS = ["Enter", " "] as const;

/**
 * End of a mastery round, laid out like the practice games' round recap: the
 * round's kanji as tiles, bordered by the rating each got.
 */
export const MasteryEndScreen = ({
  results,
  saveError,
  saveFailures,
  cardType,
  moreDue,
  onMore,
  onDone,
}: {
  results: MasteryResult[];
  /** Set when a grade could not be saved. */
  saveError: string | null;
  /** The grades behind `saveError`, for the "View more" report. */
  saveFailures: SaveFailure[];
  cardType: CardType;
  /** Cards still due right now. */
  moreDue: number;
  onMore: () => void;
  onDone: () => void;
}) => {
  const [cheer] = useState(pickEndCheer);
  const [reportOpen, setReportOpen] = useState(false);
  const openedKanji = useOpenedParam();
  const setOpenedKanji = useSetOpenedParam();
  const nextDueAt = useNextDueAt(cardType);
  const hasMore = moreDue > 0;

  // A tile can open the kanji drawer; don't carry it into the next screen.
  const more = () => {
    setOpenedKanji(null);
    onMore();
  };
  const done = () => {
    setOpenedKanji(null);
    onDone();
  };

  // While a tile's drawer or the report is open, Enter and Escape belong to it.
  const overlayOpen = openedKanji != null || reportOpen;
  useEnterAction(hasMore ? more : done, !overlayOpen, CONTINUE_KEYS);
  useEnterAction(done, !overlayOpen, ["Escape"]);

  return (
    <RoundRecap
      cheer={cheer}
      subtitle={hasMore ? `${moreDue} more due now` : nextDueCopy(nextDueAt)}
      tiles={results.map(({ kanji, keyword, rating }) => ({
        kanji,
        keyword,
        correct: rating !== "again",
        rating,
      }))}
      onContinue={hasMore ? more : undefined}
      onEnd={done}
      notice={
        saveError && (
          <>
            <UserNotice className={cn("text-center", cnWarningText)}>
              Some answers weren&apos;t saved. {saveError}{" "}
              <NoticeAction onClick={() => setReportOpen(true)}>
                View more
              </NoticeAction>
            </UserNotice>
            <UnsavedAnswersDialog
              open={reportOpen}
              cardType={cardType}
              failures={saveFailures}
              onClose={() => setReportOpen(false)}
            />
          </>
        )
      }
    />
  );
};
