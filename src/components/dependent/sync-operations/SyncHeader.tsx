import type { SyncStatus } from "engine-contract";
import {
  syncDotClassName,
  syncLabel,
} from "@/components/dependent/account/sync-display";
import { SyncNowButton } from "@/components/dependent/account/SyncNowButton";
import { Button } from "@/components/ui/button";
import { useNetworkState } from "@/hooks/use-network-state";
import { OLD_PENDING_COPY, PUSH_BLOCKED_COPY } from "@/lib/engine/engine-copy";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { cn } from "@/lib/utils";

const OLD_PENDING_MS = 7 * 24 * 60 * 60 * 1000;

const Notice = ({ children }: { children: string }) => (
  <p className="text-xs text-amber-600 dark:text-amber-400">{children}</p>
);

/** Sync state, its remedies (Retry / Refresh data / Sync now) and warnings. */
export const SyncHeader = ({ sync }: { sync: SyncStatus | undefined }) => {
  const api = useEngineApi();
  const { online } = useNetworkState();
  const failure = sync?.state === "failed" ? sync.error : null;
  const needsRefresh = failure?.code === "catch_up_required";
  const label =
    needsRefresh && online ? "Data refresh needed" : syncLabel(sync, online);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span
            aria-hidden
            className={cn(
              "size-2.5 rounded-full",
              syncDotClassName(sync, online)
            )}
          />
          {label}
          {failure !== null && !needsRefresh && online && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={() => api?.sync.requestSync()}
            >
              Retry
            </Button>
          )}
        </div>
        <SyncNowButton label={needsRefresh ? "Refresh data" : "Sync now"} />
      </div>
      {sync?.pushBlocked && <Notice>{PUSH_BLOCKED_COPY}</Notice>}
      {(sync?.oldestPendingOperationAgeMs ?? 0) > OLD_PENDING_MS && (
        <Notice>{OLD_PENDING_COPY}</Notice>
      )}
    </div>
  );
};
