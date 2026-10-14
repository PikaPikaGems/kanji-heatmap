import type { SyncStatus } from "engine-contract";
import { Drawer as DrawerPrimitive } from "vaul";
import { SpanBadge } from "@/components/ui/badge";
import { useNetworkState } from "@/hooks/use-network-state";
import { openSyncOperations } from "@/lib/engine/sync-operations-dialog";
import { useFailedOpsCount } from "@/lib/engine/sync-queries";
import { cn } from "@/lib/utils";
import { syncDotClassName, syncLabel } from "./sync-display";

/**
 * Sync state pill for the sidebar account row, with a badge for failed
 * operations. Opens the pending / failed operations modal (design 5.7).
 */
export const SyncChip = ({ sync }: { sync: SyncStatus | undefined }) => {
  const { online } = useNetworkState();
  const failedCount = useFailedOpsCount()?.count ?? 0;
  const pendingCount = sync?.pendingOperationsCount ?? 0;
  const label = syncLabel(sync, online);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {/* The modal lives outside the drawer, so close the drawer first. */}
      <DrawerPrimitive.Close asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${label}. View sync details`}
          onClick={() => openSyncOperations()}
        >
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full",
              syncDotClassName(sync, online)
            )}
          />
          {label}
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
      </DrawerPrimitive.Close>
      {pendingCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {pendingCount} pending
        </span>
      )}
    </div>
  );
};
