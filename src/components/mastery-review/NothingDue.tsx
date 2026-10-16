import type { UTCTimestamp } from "engine-contract";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { useSetOpenedParam } from "@/hooks/routing-hooks";
import { nextReviewCopy } from "./next-due-copy";
import { useSuggestedKanji } from "./use-suggested-kanji";

/**
 * Start screen with no card due: says so, suggests a kanji to add to the
 * review pile (opens its drawer), and shows when the next review is.
 */
export const NothingDue = ({
  nextDueAt,
}: {
  nextDueAt: UTCTimestamp | null | undefined;
}) => {
  const suggestion = useSuggestedKanji();
  const setOpenedKanji = useSetOpenedParam();
  const nextReview = nextReviewCopy(nextDueAt);

  return (
    <div className="flex flex-col items-center gap-2">
      <UserNotice icon={null} className="text-base font-bold text-center">
        Nothing due right now.
        {suggestion != null && (
          <span key={suggestion} className="animate-fade-in-fast">
            {" "}
            How about adding{" "}
            <NoticeAction onClick={() => setOpenedKanji(suggestion)}>
              <span className="text-xl kanji-font">{suggestion}</span>
            </NoticeAction>{" "}
            to your review pile?
          </span>
        )}
      </UserNotice>
      {nextReview && (
        <p className="text-sm text-muted-foreground">{nextReview}</p>
      )}
    </div>
  );
};
