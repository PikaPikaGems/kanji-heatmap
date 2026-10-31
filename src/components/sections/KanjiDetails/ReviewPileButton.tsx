import { WriteBlockedPopover } from "@/components/dependent/account/WriteBlockedDialog";
import type { ReactNode } from "react";
import type { ReviewPileItemView } from "engine-contract";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import { NEW_LABEL } from "@/lib/engine/mastery-heatmap-metrics";
import { itemBand, MASTERY_LEVEL_LABELS } from "@/lib/engine/mastery-metrics";
import { Loader2, PlusCircle } from "lucide-react";
import { GenericPopover } from "@/components/common/GenericPopover";
import { InfoIcon } from "@/components/icons";
import { MeasureLegendContent } from "@/components/screens/MasteryScreen/MeasureIntro";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { copyForCode, UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { snapshotValue } from "@/lib/engine/store-cache";
import {
  type AccountStatus,
  getWriteBlocker,
  useAccountStatus,
} from "@/lib/engine/use-account-status";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import {
  pileWordsLabel,
  useAddToReviewPile,
  type PileWords,
} from "@/lib/engine/use-review-pile-add";
import {
  refreshReviewPileItem,
  useReviewPileItem,
} from "@/lib/engine/use-review-pile-item";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import { reviewPileAddCn } from "./review-pile-add-cn";

const AddLabel = ({ words }: { words: PileWords }) => (
  <>
    <PlusCircle size={16} className="translate-y-0.5 shrink-0" /> Add{" "}
    {pileWordsLabel(words)} to my review pile
  </>
);

/** A short line under the button: why it is disabled, or why a call failed. */
const Note = ({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "info" | "error";
}) =>
  tone === "error" ? (
    <p
      role="alert"
      className={cn("px-2 text-xs text-left max-w-56", cnWarningText)}
    >
      {children}
    </p>
  ) : (
    <UserNotice icon={null} className="px-2 text-xs max-w-56">
      {children}
    </UserNotice>
  );

const LoadFailedNote = ({ onRetry }: { onRetry?: () => void }) => (
  <UserNotice className="px-2 text-xs max-w-64">
    Couldn&apos;t load your review pile.{" "}
    {onRetry && <NoticeAction onClick={onRetry}>Try again</NoticeAction>}
  </UserNotice>
);

/**
 * Shown once the kanji is in the review pile: a pill "● Fresh ⓘ" with the
 * kanji's combined mastery (the lowest of its cards) in its /mastery color,
 * "New" until every card is reviewed. Tapping it opens the same legend as
 * /mastery's, so the color and name can be read.
 */
const PileMastery = ({ item }: { item: ReviewPileItemView }) => {
  const band = itemBand(item, "combined", "mastery", Date.now());
  const label = band == null ? NEW_LABEL : MASTERY_LEVEL_LABELS[band];
  return (
    <GenericPopover
      trigger={
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 ml-2 text-xs font-semibold transition-colors border rounded-full whitespace-nowrap hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            aria-hidden
            className={cn(
              "size-3 rounded-full border border-foreground/40",
              getBandFillCn("mastery", band)
            )}
          />
          <span className="sr-only">Mastery:</span>
          {label}
          <InfoIcon aria-hidden size={12} className="text-muted-foreground" />
        </button>
      }
      content={
        <MeasureLegendContent measure="mastery" combined title="Mastery" />
      }
    />
  );
};

/** Logged in: reads `reviews.pile.watch(kanji)`, adds with the anchor words. */
const ActiveReviewPileButton = ({
  kanji,
  words,
  wordsLoaded,
  status,
}: {
  kanji: string;
  words: PileWords;
  wordsLoaded: boolean;
  status: Extract<AccountStatus, { kind: "active" }>;
}) => {
  const api = useEngineApi();
  const snapshot = useReviewPileItem(kanji);
  const { add, action, tooLong } = useAddToReviewPile(kanji, words);

  const current = snapshotValue(snapshot);
  const blocker = getWriteBlocker(status);

  if (current) {
    return <PileMastery item={current} />;
  }

  return (
    <div className="flex flex-col items-start min-w-0">
      {blocker ? (
        // Can't save right now: the action opens the reason instead.
        <WriteBlockedPopover
          blocker={blocker}
          trigger={
            <button type="button" className={reviewPileAddCn}>
              <AddLabel words={words} />
            </button>
          }
        />
      ) : (
        <button
          type="button"
          className={reviewPileAddCn}
          disabled={
            !api ||
            !wordsLoaded ||
            current === undefined ||
            action.kind === "busy" ||
            tooLong
          }
          onClick={() => void add()}
        >
          {action.kind === "busy" ? (
            <Loader2 size={16} className="translate-y-0.5 animate-spin" />
          ) : (
            <PlusCircle size={16} className="translate-y-0.5 shrink-0" />
          )}
          Add {pileWordsLabel(words)} to my review pile
        </button>
      )}
      {snapshot.status === "failed" && (
        <LoadFailedNote
          onRetry={
            snapshot.retryable && api
              ? () => void refreshReviewPileItem(api, kanji)
              : undefined
          }
        />
      )}
      {snapshot.status === "ready" && !snapshot.result.ok && <LoadFailedNote />}
      {tooLong && <Note tone="error">{copyForCode("validation_failed")}</Note>}
      {action.kind === "error" && <Note tone="error">{action.message}</Note>}
    </div>
  );
};

/**
 * Review-pile control in the kanji drawer: add the anchor words, or see that
 * the kanji is in the pile (removing it lives in Your Progress). The caller
 * hides it in builds without the engine.
 */
export const ReviewPileButton = ({
  kanji,
  words,
  wordsLoaded,
}: {
  kanji: string;
  words: PileWords;
  /** False until the secondary word is known; adding waits for it. */
  wordsLoaded: boolean;
}) => {
  const status = useAccountStatus();

  if (status.kind === "active") {
    return (
      <ActiveReviewPileButton
        key={kanji}
        kanji={kanji}
        words={words}
        wordsLoaded={wordsLoaded}
        status={status}
      />
    );
  }
  if (status.kind === "signed-out") {
    return (
      <button
        type="button"
        className={reviewPileAddCn}
        onClick={openLoginDialog}
      >
        <AddLabel words={words} />
      </button>
    );
  }
  if (status.kind === "unavailable") {
    return (
      <GenericPopover
        trigger={
          <button type="button" className={reviewPileAddCn}>
            <AddLabel words={words} />
          </button>
        }
        content={
          <div className="p-3 text-sm max-w-64">{UPDATE_BROWSER_COPY}</div>
        }
      />
    );
  }

  // Still loading, or the account is in an error / recovery state.
  const blocker = getWriteBlocker(status);
  if (blocker && blocker !== "loading") {
    return (
      <WriteBlockedPopover
        blocker={blocker}
        trigger={
          <button type="button" className={reviewPileAddCn}>
            <AddLabel words={words} />
          </button>
        }
      />
    );
  }
  return (
    <button type="button" className={reviewPileAddCn} disabled>
      <AddLabel words={words} />
    </button>
  );
};
