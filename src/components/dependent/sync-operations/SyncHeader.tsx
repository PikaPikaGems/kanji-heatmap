import type { SyncStatus } from "engine-contract";
import { RotateCcw } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { UserNotice } from "@/components/common/UserNotice";
import {
  needsDataRefresh,
  syncDotClassName,
  syncLabel,
} from "@/components/dependent/account/sync-display";
import { useNetworkState } from "@/hooks/use-network-state";
import { OLD_PENDING_COPY, PUSH_BLOCKED_COPY } from "@/lib/engine/engine-copy";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { cn } from "@/lib/utils";

export const OLD_PENDING_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sync state and its warnings. The status takes only the width its content
 * needs; "Retry" follows a failure, after a " · ".
 */
export const SyncHeader = ({ sync }: { sync: SyncStatus | undefined }) => {
  const api = useEngineApi();
  const { online } = useNetworkState();
  const needsRefresh = needsDataRefresh(sync);
  const failure = sync?.state === "failed" ? sync.error : null;
  const label =
    needsRefresh && online ? "Data refresh needed" : syncLabel(sync, online);
  const canRetry = failure !== null && !needsRefresh && online;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center self-start gap-2 px-3 py-2.5 text-sm border rounded-2xl border-foreground/20 bg-muted/15">
        <span
          aria-hidden
          className={cn(
            "size-2.5 rounded-full shrink-0",
            syncDotClassName(sync, online)
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
      {sync?.pushBlocked && <UserNotice>{PUSH_BLOCKED_COPY}</UserNotice>}
      {(sync?.oldestPendingOperationAgeMs ?? 0) > OLD_PENDING_MS && (
        <UserNotice>{OLD_PENDING_COPY}</UserNotice>
      )}
    </div>
  );
};
