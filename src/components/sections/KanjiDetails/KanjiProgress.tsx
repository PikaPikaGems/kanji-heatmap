import { Loader2, PlusCircle } from "lucide-react";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { LoginNotice } from "@/components/dependent/account/LoginNotice";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import {
  getWriteBlocker,
  useAccountStatus,
} from "@/lib/engine/use-account-status";
import {
  pileWordsLabel,
  useAddToReviewPile,
  usePileWords,
  type PileWords,
} from "@/lib/engine/use-review-pile-add";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import {
  refreshReviewPileItem,
  useReviewPileItem,
} from "@/lib/engine/use-review-pile-item";
import type { ReviewPileItemView } from "engine-contract";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import { NOT_STARTED_LABEL } from "@/lib/engine/mastery-heatmap-metrics";
import {
  itemBand,
  itemCards,
  MASTERY_LEVEL_LABELS,
} from "@/lib/engine/mastery-metrics";
import { ProgressTable, type ProgressTableWords } from "./ProgressTable";
import { RemoveFromReviewPile } from "./RemoveFromReviewPile";
import { reviewPileAddCn } from "./review-pile-add-cn";
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

/** The words the kanji's cards would ask about if it were added now. */
const wordsFromData = (
  kanji: string,
  pile: { words: PileWords } | null
): ProgressTableWords => ({
  writing: kanji,
  reading: pile?.words.word,
  secondaryReading: pile?.words.secondaryWord,
});

/** The words the pile item's cards ask about (fixed when it was added). */
const wordsFromItem = (item: ReviewPileItemView): ProgressTableWords => ({
  writing: item.kanji,
  reading: item.word,
  secondaryReading: item.secondary?.word,
});

/** "Combined mastery: ● Fresh (lowest of 3 cards)", above the table. */
const CombinedMastery = ({ item }: { item: ReviewPileItemView }) => {
  const band = itemBand(item, "combined", "mastery", Date.now());
  const count = itemCards(item).length;
  return (
    <p className="flex flex-wrap items-center px-1 pt-1 text-sm text-left gap-x-1.5">
      <span>Combined mastery:</span>
      <span className="inline-flex items-center gap-1.5 font-bold">
        <span
          aria-hidden
          className={cn(
            "size-3 rounded-sm border border-black/20 dark:border-white/25",
            getBandFillCn("mastery", band)
          )}
        />
        {band == null ? NOT_STARTED_LABEL : MASTERY_LEVEL_LABELS[band]}
      </span>
      <span className="text-muted-foreground">
        ({band == null ? "until all" : "lowest of"} {count} cards
        {band == null ? " are reviewed" : ""})
      </span>
    </p>
  );
};

/** Logged out: the table with its defaults, under the log-in notice. */
const SignedOutKanjiProgress = ({ kanji }: { kanji: string }) => {
  const pile = usePileWords(kanji);
  return (
    <div className="flex flex-col gap-3 pb-1">
      <LoginNotice
        to="track your progress on this kanji"
        className="px-1 pt-1"
      />
      <ProgressTable item={null} words={wordsFromData(kanji, pile)} />
    </div>
  );
};

/** Logged in, not in the review pile: the defaults, plus a way to add it. */
const NotInPileKanjiProgress = ({
  kanji,
  pile,
  blocked,
}: {
  kanji: string;
  /** The kanji's anchor words, which the pile stores with it. */
  pile: { words: PileWords; loaded: boolean } | null;
  blocked: boolean;
}) => {
  const { add, action, tooLong, hasApi } = useAddToReviewPile(
    kanji,
    pile?.words ?? { word: "" }
  );
  const canAdd = pile != null && pile.loaded && hasApi && !blocked && !tooLong;

  return (
    <div className="flex flex-col gap-3 pb-1">
      <div className="flex flex-col items-start gap-2 px-1 pt-1">
        <UserNotice icon="📚">
          This kanji {`is not`} in your review pile yet.
        </UserNotice>
        {/* Looks like the drawer's own "Add 高い · 最高 to my review pile". */}
        {pile != null && (
          <button
            type="button"
            className={cn(reviewPileAddCn, "-ml-2")}
            onClick={() => void add()}
            disabled={!canAdd || action.kind === "busy"}
          >
            {action.kind === "busy" ? (
              <Loader2 size={16} className="translate-y-0.5 animate-spin" />
            ) : (
              <PlusCircle size={16} className="translate-y-0.5 shrink-0" />
            )}
            Add {pileWordsLabel(pile.words)} to my review pile
          </button>
        )}
        {action.kind === "error" && (
          <p role="alert" className={cn("text-sm text-left", cnWarningText)}>
            {action.message}
          </p>
        )}
      </div>
      <ProgressTable item={null} words={wordsFromData(kanji, pile)} />
    </div>
  );
};

/** Logged in: the kanji's cards from `pile.watch`. */
const ActiveKanjiProgress = ({ kanji }: { kanji: string }) => {
  const api = useEngineApi();
  const snapshot = useReviewPileItem(kanji);
  const blocker = getWriteBlocker(useAccountStatus());
  const pile = usePileWords(kanji);

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
        pile={pile}
        blocked={blocker != null}
      />
    );
  }
  const missingSecondary =
    item.secondary == null ? pile?.words.secondaryWord : undefined;
  return (
    <div className="flex flex-col gap-1 pb-1">
      <CombinedMastery item={item} />
      <ProgressTable item={item} words={wordsFromItem(item)} />
      {missingSecondary && (
        <UserNotice className="px-1 pt-2 text-xs text-left">
          Reading II isn&apos;t in your review pile for this kanji. To add{" "}
          <span className="kanji-font">{missingSecondary}</span>, remove{" "}
          <span className="kanji-font">{kanji}</span> from your review pile and
          add it again. Its progress starts over.
        </UserNotice>
      )}
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
  if (status.kind === "signed-out") {
    return <SignedOutKanjiProgress kanji={kanji} />;
  }
  return <ActiveKanjiProgress kanji={kanji} />;
};

export default KanjiProgress;
