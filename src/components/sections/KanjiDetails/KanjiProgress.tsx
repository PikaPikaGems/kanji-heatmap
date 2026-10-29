import { Loader2 } from "lucide-react";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { LoginNotice } from "@/components/dependent/account/LoginNotice";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import {
  getWriteBlocker,
  useAccountStatus,
} from "@/lib/engine/use-account-status";
import { useAddToReviewPile } from "@/lib/engine/use-review-pile-add";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import {
  refreshReviewPileItem,
  useReviewPileItem,
} from "@/lib/engine/use-review-pile-item";
import { useKanjiRepresentativeWord } from "@/providers/kanji-representative-word-hooks";
import { ProgressTable } from "./ProgressTable";
import { RemoveFromReviewPile } from "./RemoveFromReviewPile";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

const Spinner = () => (
  <div
    className="flex items-center justify-center w-full h-24"
    role="status"
    aria-label="Loading"
  >
    <Loader2 className="size-6 animate-spin" />
  </div>
);

const LoadFailed = ({ onRetry }: { onRetry?: () => void }) => (
  <UserNotice className="p-3">
    Couldn&apos;t load your progress.{" "}
    {onRetry && <NoticeAction onClick={onRetry}>Try again</NoticeAction>}
  </UserNotice>
);

/** Logged out: the table with its defaults, under the log-in notice. */
const SignedOutKanjiProgress = () => (
  <div className="flex flex-col gap-3 pb-1">
    <LoginNotice to="track your progress on this kanji" className="px-1 pt-1" />
    <ProgressTable item={null} />
  </div>
);

/** Logged in, not in the review pile: the defaults, plus a way to add it. */
const NotInPileKanjiProgress = ({
  kanji,
  word,
  blocked,
}: {
  kanji: string;
  /** The kanji's representative word, which the pile stores with it. */
  word: string | null;
  blocked: boolean;
}) => {
  const { add, action, tooLong, hasApi } = useAddToReviewPile(
    kanji,
    word ?? ""
  );
  const canAdd = word != null && hasApi && !blocked && !tooLong;

  return (
    <div className="flex flex-col gap-3 pb-1">
      <div className="flex flex-col gap-1 px-1 pt-1">
        <UserNotice icon="📚">
          This kanji {`is not`} in your review pile yet. <br />
          {word != null && (
            <NoticeAction
              onClick={() => void add()}
              disabled={!canAdd || action.kind === "busy"}
              additionalClassName="text-green-500 hover:text-green-400 hover:decoration-solid"
            >
              Add {kanji} to your review pile
            </NoticeAction>
          )}
        </UserNotice>
        {action.kind === "error" && (
          <p role="alert" className={cn("text-sm text-left", cnWarningText)}>
            {action.message}
          </p>
        )}
      </div>
      <ProgressTable item={null} />
    </div>
  );
};

/** Logged in: the kanji's reading and writing cards from `pile.watch`. */
const ActiveKanjiProgress = ({ kanji }: { kanji: string }) => {
  const api = useEngineApi();
  const snapshot = useReviewPileItem(kanji);
  const blocker = getWriteBlocker(useAccountStatus());
  const word = useKanjiRepresentativeWord(kanji)?.word ?? null;

  if (snapshot.status === "loading" || snapshot.status === "unavailable") {
    return <Spinner />;
  }
  if (snapshot.status === "failed") {
    return (
      <LoadFailed
        onRetry={
          snapshot.retryable && api
            ? () => void refreshReviewPileItem(api, kanji)
            : undefined
        }
      />
    );
  }
  if (!snapshot.result.ok) return <LoadFailed />;

  const item = snapshot.result.value;
  if (item === null) {
    return (
      <NotInPileKanjiProgress
        kanji={kanji}
        word={word}
        blocked={blocker != null}
      />
    );
  }
  return (
    <div className="flex flex-col gap-1 pb-1">
      <ProgressTable item={item} />
      <div className="px-1 text-left">
        <RemoveFromReviewPile kanji={kanji} disabled={blocker != null} />
      </div>
    </div>
  );
};

/**
 * Review progress for one kanji, from its review-pile item. What shows depends
 * on the account: the table when logged in (with defaults while the kanji is
 * not in the pile), the same table with defaults and a log-in notice when
 * logged out, and an explanation otherwise. The caller hides the section in
 * builds without the engine.
 */
const KanjiProgress = ({ kanji }: { kanji: string }) => {
  const status = useAccountStatus();

  if (status.kind === "unavailable") {
    return <UserNotice className="p-3">{UPDATE_BROWSER_COPY}</UserNotice>;
  }
  if (status.kind === "error" || status.kind === "recovery") {
    return (
      <UserNotice className="p-3">
        Your progress isn&apos;t available right now.
      </UserNotice>
    );
  }
  if (status.kind === "loading") return <Spinner />;
  if (status.kind === "signed-out") return <SignedOutKanjiProgress />;
  return <ActiveKanjiProgress kanji={kanji} />;
};

export default KanjiProgress;
