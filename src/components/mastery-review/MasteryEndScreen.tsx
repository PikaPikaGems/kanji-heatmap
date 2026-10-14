import { useState } from "react";
import type { CardType, FsrsRating } from "engine-contract";
import { RoundRecap } from "@/components/shared-practice";
import { RATING_BORDER } from "@/components/shared-practice/rating-border";
import { useEnterAction } from "@/hooks/use-enter-action";
import { useSetOpenedParam } from "@/hooks/routing-hooks";
import { pickEndCheer } from "@/lib/practice-cheers";
import { cn } from "@/lib/utils";
import { nextDueCopy } from "./next-due-copy";
import type { MasteryResult } from "./use-mastery-session";
import { useNextDueAt } from "./use-next-due-at";

const CONTINUE_KEYS = ["Enter", " "] as const;

const LEGEND: readonly { rating: FsrsRating; label: string }[] = [
  { rating: "easy", label: "Easy" },
  { rating: "good", label: "Good" },
  { rating: "hard", label: "Hard" },
  { rating: "again", label: "Again" },
];

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

  useEnterAction(hasMore ? more : done, true, CONTINUE_KEYS);
  useEnterAction(done, true, ["Escape"]);

  return (
    <div className="h-full animate-fade-in">
      <RoundRecap
        cheer={cheer}
        summary={
          <>
            <p className="mt-2 text-sm font-bold text-center text-muted-foreground">
              {hasMore ? `${moreDue} more due now` : nextDueCopy(nextDueAt)}
            </p>
            <ul
              className="flex flex-wrap justify-center mt-3 text-xs font-bold gap-x-3 gap-y-1 text-muted-foreground"
              aria-label="Tile border colors"
            >
              {LEGEND.map(({ rating, label }) => (
                <li key={rating} className="flex items-center gap-1">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-3 rounded border-2 border-dashed",
                      RATING_BORDER[rating]
                    )}
                  />
                  {label}
                </li>
              ))}
            </ul>
          </>
        }
        tiles={results.map(({ kanji, keyword, rating }) => ({
          kanji,
          keyword,
          correct: rating !== "again",
          rating,
        }))}
        afterTiles={
          saveError && (
            <p className="pb-4 text-xs text-center text-muted-foreground">
              ⚠️ Some answers weren&apos;t saved. {saveError}
            </p>
          )
        }
        primaryLabel={hasMore ? "Next round" : "Done"}
        onPrimary={hasMore ? more : done}
        secondaryLabel={hasMore ? "End Session" : undefined}
        onSecondary={hasMore ? done : undefined}
      />
    </div>
  );
};
