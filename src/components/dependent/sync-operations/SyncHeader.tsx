import type { SyncStatus } from "engine-contract";
import { RotateCcw } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import {
  needsDataRefresh,
  syncDotClassName,
  syncLabel,
} from "@/components/dependent/account/sync-display";
import { useNetworkState } from "@/hooks/use-network-state";
import { WriteBlockerCard } from "@/components/dependent/account/WriteBlockerCard";
import { useDataDownload, useWriteBlocker } from "@/lib/engine/data-download";
import {
  OLD_PENDING_COPY,
  PUSH_BLOCKED_COPY,
  REVIEW_SETTINGS_UPDATE_COPY,
} from "@/lib/engine/engine-copy";
import { closeSyncOperations } from "@/lib/engine/sync-operations-dialog";
import {
  useAccountStatus,
  type WriteBlocker,
} from "@/lib/engine/use-account-status";
import { openLogoutDialog } from "@/lib/engine/logout-flow";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

export const OLD_PENDING_MS = 7 * 24 * 60 * 60 * 1000;

/** What each write blocker means for this device's changes. */
const BLOCKER_DETAIL: Partial<Record<WriteBlocker, string>> = {
  "not-downloaded": "It's safe in your account.",
  cache_rebuilding: "It's safe in your account.",
  entitlement_expired:
    "Changes on this device stay here until your account can save again.",
  outbox_full: "Sync to save again.",
  outbox_stale: "Sync to save again.",
  recovery: "Fix it to keep syncing.",
};

/**
 * The account's warnings (the sidebar's ‼️ points here): why it can't save,
 * as the same card FSRS settings shows (one reason, the first that applies),
 * or review settings that need an app refresh.
 */
const AccountNotices = () => {
  const status = useAccountStatus();
  const blocker = useWriteBlocker();
  if (status.kind !== "active") return null;

  return (
    <>
      {blocker !== null && (
        <WriteBlockerCard modal blocker={blocker}>
          {BLOCKER_DETAIL[blocker] ?? "Changes can't be saved right now."}
        </WriteBlockerCard>
      )}
      {status.reviewSettings.status === "update_required" && (
        <UserNotice>{REVIEW_SETTINGS_UPDATE_COPY}</UserNotice>
      )}
    </>
  );
};

/**
 * Sync state and its warnings. The status takes only the width its content
 * needs; "Retry" follows a failure, after a " · ".
 */
export const SyncHeader = ({ sync }: { sync: SyncStatus | undefined }) => {
  const api = useEngineApi();
  const { online } = useNetworkState();
  const account = useAccountStatus();
  const download = useDataDownload();
  const needsRefresh = needsDataRefresh(sync);
  const failure = sync?.state === "failed" ? sync.error : null;
  const label =
    needsRefresh && online
      ? "Data refresh needed"
      : syncLabel(sync, online, download);
  // Not while the data isn't downloaded: Retry is an ordinary sync, and the
  // card's "Download now" is what fixes that.
  const canRetry =
    failure !== null && !needsRefresh && online && download === "ready";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center self-start gap-2 px-3 py-2.5 text-sm border rounded-2xl border-foreground/20 bg-muted/15">
        <span
          aria-hidden
          className={cn(
            "size-2.5 rounded-full shrink-0",
            syncDotClassName(sync, online, download)
          )}
        />
        <p className="font-semibold">{label}</p>
        {canRetry && (
          <>
            <span aria-hidden>·</span>
            <TextActionButton
              className="-ml-0.5 leading-5"
              icon={<RotateCcw aria-hidden size={14} />}
              onClick={() => api?.sync.requestSync()}
            >
              Retry
            </TextActionButton>
          </>
        )}
      </div>
      <AccountNotices />
      {/* Saving is stuck until they act, so it reads as a warning. */}
      {sync?.pushBlocked && (
        <UserNotice className={cnWarningText}>
          {PUSH_BLOCKED_COPY.before}
          {account.kind === "active" ? (
            <NoticeAction
              onClick={() => {
                // One modal at a time.
                closeSyncOperations();
                openLogoutDialog(account.userId);
              }}
            >
              {PUSH_BLOCKED_COPY.action}
            </NoticeAction>
          ) : (
            PUSH_BLOCKED_COPY.action
          )}
          {PUSH_BLOCKED_COPY.after}
        </UserNotice>
      )}
      {(sync?.oldestPendingOperationAgeMs ?? 0) > OLD_PENDING_MS && (
        <UserNotice>{OLD_PENDING_COPY}</UserNotice>
      )}
    </div>
  );
};
