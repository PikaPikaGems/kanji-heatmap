import type { SyncStatus } from "engine-contract";
import { SpanBadge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { copyForCode, PUSH_BLOCKED_COPY } from "@/lib/engine/engine-copy";
import { snapshotValue } from "@/lib/engine/store-cache";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import { cn } from "@/lib/utils";
import { SyncNowButton } from "./SyncNowButton";

const relativeTime = (at: number) => {
  const minutes = Math.floor(Math.max(0, Date.now() - at) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
};

const syncLabel = (sync: SyncStatus | undefined) => {
  if (!sync || sync.state === "syncing") return "Syncing…";
  if (sync.state === "failed") {
    // The app refreshes its data on its own for this one.
    return sync.error.code === "catch_up_required" ? "Syncing…" : "Sync failed";
  }
  if (sync.lastSyncedAt === undefined) return "Not synced yet";
  return `Synced ${relativeTime(sync.lastSyncedAt)}`;
};

const dotClassName = (sync: SyncStatus | undefined) => {
  if (!sync || sync.state === "syncing") return "bg-amber-500 animate-pulse";
  if (sync.state === "failed") return "bg-destructive";
  if (sync.lastSyncedAt === undefined) return "bg-muted-foreground";
  return "bg-green-500";
};

/**
 * Sync state pill for the sidebar account row, with a badge for failed
 * operations. Opens a small popover with details and "Sync now". (The full
 * operations modal is a later milestone.)
 */
export const SyncChip = ({ sync }: { sync: SyncStatus | undefined }) => {
  const failedSnapshot = useEngineQuery("sync.watchFailedOpsCount", (api) =>
    api.sync.watchFailedOpsCount()
  );
  const failed = snapshotValue(failedSnapshot);
  const failedCount = failed?.count ?? 0;
  const pendingCount = sync?.pendingOperationsCount ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${syncLabel(sync)}. Open sync details`}
          >
            <span
              aria-hidden
              className={cn("size-2 rounded-full", dotClassName(sync))}
            />
            {syncLabel(sync)}
            {failedCount > 0 && (
              <SpanBadge
                variant="destructive"
                className="px-1.5 py-0 text-[10px]"
                title={`${failedCount} failed ${failedCount === 1 ? "operation" : "operations"}`}
              >
                {failedCount}
              </SpanBadge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-3 text-xs" align="start">
          <div className="flex flex-col gap-2 text-left">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Status</span>
              <span>{syncLabel(sync)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Waiting to upload</span>
              <span>{pendingCount}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Need attention</span>
              <span>{failedCount}</span>
            </div>
            {sync?.state === "failed" && (
              <p className="text-destructive">{copyForCode(sync.error.code)}</p>
            )}
            {sync?.pushBlocked && (
              <p className="text-amber-600 dark:text-amber-400">
                {PUSH_BLOCKED_COPY}
              </p>
            )}
            <SyncNowButton />
          </div>
        </PopoverContent>
      </Popover>
      {pendingCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {pendingCount} pending
        </span>
      )}
    </div>
  );
};
