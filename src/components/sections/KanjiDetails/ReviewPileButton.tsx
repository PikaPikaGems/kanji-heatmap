import { WriteBlockerCopy } from "@/components/dependent/account/WriteBlockedDialog";
import type { ReactNode } from "react";
import type { ReviewPileItemView } from "engine-contract";
import { FreqSquare } from "@/components/common/freq/FreqSquare";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import { NOT_STARTED_LABEL } from "@/lib/engine/mastery-heatmap-metrics";
import { itemBand, MASTERY_LEVEL_LABELS } from "@/lib/engine/mastery-metrics";
import { Loader2, PlusCircle } from "lucide-react";
import { GenericPopover } from "@/components/common/GenericPopover";
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
import { useAddToReviewPile } from "@/lib/engine/use-review-pile-add";
import {
  refreshReviewPileItem,
  useReviewPileItem,
} from "@/lib/engine/use-review-pile-item";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

const addCn =
  "flex text-left gap-2 px-2 py-2 text-sm font-bold underline rounded-lg decoration-dotted underline-offset-4 hover:text-green-400 text-green-500 hover:decoration-solid disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline";

const AddLabel = ({ word }: { word: string }) => (
  <>
    <PlusCircle size={16} className="translate-y-0.5 shrink-0" /> Add {word} to
    my review pile
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
 * "Mastery [] Fresh" next to "✓ In review pile": the kanji's combined mastery
 * (the weaker of reading and writing), "Not started" until both are reviewed.
 */
const PileMastery = ({ item }: { item: ReviewPileItemView }) => {
  const band = itemBand(item, "combined", "mastery", Date.now());
  const label = band == null ? NOT_STARTED_LABEL : MASTERY_LEVEL_LABELS[band];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
      Mastery
      <FreqSquare srOnly="" cn={getBandFillCn("mastery", band)} />
      <span className="font-bold text-foreground">{label}</span>
    </span>
  );
};

/** Logged in: reads `reviews.pile.watch(kanji)`, adds with the anchor word. */
const ActiveReviewPileButton = ({
  kanji,
  word,
  status,
}: {
  kanji: string;
  word: string;
  status: Extract<AccountStatus, { kind: "active" }>;
}) => {
  const api = useEngineApi();
  const snapshot = useReviewPileItem(kanji);
  const { add, action, tooLong } = useAddToReviewPile(kanji, word);

  const current = snapshotValue(snapshot);
  const blocker = getWriteBlocker(status);

  if (current) {
    return (
      <div className="flex flex-col items-start min-w-0">
        <span className="px-2 pt-2 pb-1 text-sm font-bold text-green-500">
          ✓ In review pile
        </span>
        <PileMastery item={current} />
        {blocker && (
          <Note tone="info">
            <WriteBlockerCopy blocker={blocker} />
          </Note>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start min-w-0">
      <button
        type="button"
        className={addCn}
        disabled={
          !api ||
          current === undefined ||
          action.kind === "busy" ||
          !!blocker ||
          tooLong
        }
        onClick={() => void add()}
      >
        {action.kind === "busy" ? (
          <Loader2 size={16} className="translate-y-0.5 animate-spin" />
        ) : (
          <PlusCircle size={16} className="translate-y-0.5 shrink-0" />
        )}
        Add {word} to my review pile
      </button>
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
      {blocker && (
        <Note tone="info">
          <WriteBlockerCopy blocker={blocker} />
        </Note>
      )}
      {tooLong && <Note tone="error">{copyForCode("validation_failed")}</Note>}
      {action.kind === "error" && <Note tone="error">{action.message}</Note>}
    </div>
  );
};

/**
 * Review-pile control in the kanji drawer: add the anchor word, or see that
 * it is in the pile (removing it lives in Your Progress). The caller hides it
 * in builds without the engine.
 */
export const ReviewPileButton = ({
  kanji,
  word,
}: {
  kanji: string;
  word: string;
}) => {
  const status = useAccountStatus();

  if (status.kind === "active") {
    return (
      <ActiveReviewPileButton
        key={kanji}
        kanji={kanji}
        word={word}
        status={status}
      />
    );
  }
  if (status.kind === "signed-out") {
    return (
      <button type="button" className={addCn} onClick={openLoginDialog}>
        <AddLabel word={word} />
      </button>
    );
  }
  if (status.kind === "unavailable") {
    return (
      <GenericPopover
        trigger={
          <button type="button" className={addCn}>
            <AddLabel word={word} />
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
  return (
    <div className="flex flex-col items-start min-w-0">
      <button type="button" className={addCn} disabled>
        <AddLabel word={word} />
      </button>
      {blocker && blocker !== "loading" && (
        <Note tone="info">
          <WriteBlockerCopy blocker={blocker} />
        </Note>
      )}
    </div>
  );
};
