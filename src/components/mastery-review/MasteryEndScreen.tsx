import { useState } from "react";
import type { CardType } from "engine-contract";
import { UserNotice } from "@/components/common/UserNotice";
import { RoundRecap } from "@/components/shared-practice";
import { useEnterAction } from "@/hooks/use-enter-action";
import { useOpenedParam, useSetOpenedParam } from "@/hooks/routing-hooks";
import { pickEndCheer } from "@/lib/practice-cheers";
import { nextDueCopy } from "./next-due-copy";
import type { MasteryResult } from "./use-mastery-session";
import { useNextDueAt } from "./use-next-due-at";

const CONTINUE_KEYS = ["Enter", " "] as const;

/**
 * End of a mastery round, laid out like the practice games' round recap: the
 * round's kanji as tiles, bordered by the rating each got.
 */
export const MasteryEndScreen = ({
  results,
  saveError,
  cardType,
  moreDue,
  onMore,
  onDone,
}: {
  results: MasteryResult[];
  /** Set when a grade could not be saved. */
  saveError: string | null;
  cardType: CardType;
  /** Cards still due right now. */
  moreDue: number;
  onMore: () => void;
  onDone: () => void;
}) => {
  const [cheer] = useState(pickEndCheer);
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

  // While a tile's drawer is open, Enter and Escape belong to the drawer.
  const drawerOpen = openedKanji != null;
  useEnterAction(hasMore ? more : done, !drawerOpen, CONTINUE_KEYS);
  useEnterAction(done, !drawerOpen, ["Escape"]);

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
          <UserNotice className="font-bold text-center text-yellow-600 dark:text-yellow-400">
            Some answers weren&apos;t saved. {saveError}
          </UserNotice>
        )
      }
    />
  );
};
