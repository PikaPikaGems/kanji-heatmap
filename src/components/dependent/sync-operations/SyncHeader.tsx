import type { SyncStatus } from "engine-contract";
import { RotateCcw } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { UserNotice } from "@/components/common/UserNotice";
import {
  syncDotClassName,
  syncLabel,
} from "@/components/dependent/account/sync-display";
import { SyncNowButton } from "@/components/dependent/account/SyncNowButton";
import { useNetworkState } from "@/hooks/use-network-state";
import { OLD_PENDING_COPY, PUSH_BLOCKED_COPY } from "@/lib/engine/engine-copy";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { cn } from "@/lib/utils";

const OLD_PENDING_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sync state, its remedies and warnings. Retry follows a failure, Refresh data
 * replaces it when a refresh is needed, and Sync now only shows when it can
 * help: online with changes waiting.
 */
export const SyncHeader = ({ sync }: { sync: SyncStatus | undefined }) => {
  const api = useEngineApi();
  const { online } = useNetworkState();
  const pending = sync?.pendingOperationsCount ?? 0;
  const failure = sync?.state === "failed" ? sync.error : null;
  const needsRefresh = failure?.code === "catch_up_required";
  const label =
    needsRefresh && online ? "Data refresh needed" : syncLabel(sync, online);
  const canRetry = failure !== null && !needsRefresh && online;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border rounded-2xl border-foreground/20 bg-muted/15">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span
            aria-hidden
            className={cn(
              "size-2.5 rounded-full shrink-0",
              syncDotClassName(sync, online)
            )}
          />
          {label}
        </p>
        {canRetry && (
          <TextActionButton
            icon={<RotateCcw aria-hidden size={14} />}
            onClick={() => api?.sync.requestSync()}
          >
            Retry
          </TextActionButton>
        )}
      </div>
      {sync?.pushBlocked && <UserNotice>{PUSH_BLOCKED_COPY}</UserNotice>}
      {(sync?.oldestPendingOperationAgeMs ?? 0) > OLD_PENDING_MS && (
        <UserNotice>{OLD_PENDING_COPY}</UserNotice>
      )}
      {needsRefresh && <SyncNowButton label="Refresh data" />}
      {!needsRefresh && online && pending > 0 && <SyncNowButton />}
    </div>
  );
};
