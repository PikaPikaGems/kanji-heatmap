import type { SyncStatus } from "engine-contract";
import { Drawer as DrawerPrimitive } from "vaul";
import { useNetworkState } from "@/hooks/use-network-state";
import { openSyncOperations } from "@/lib/engine/sync-operations-dialog";
import { useFailedOpsCount } from "@/lib/engine/sync-queries";
import { cn } from "@/lib/utils";
import { syncDotClassName, syncLabel } from "./sync-display";

/**
 * The status line under the account name: "● Synced just now (2)", with the
 * pending count in brackets, then a ‼️ when something needs a look (failed
 * changes, or a notice such as premium lapsed). Both open the sync details
 * modal (design 5.7), which explains everything; the ‼️ opens Needs attention
 * when changes failed.
 */
export const SyncStatusLine = ({
  sync,
  hasNotice,
}: {
  sync: SyncStatus | undefined;
  /** A warning the modal shows (write blocked, settings update, …). */
  hasNotice: boolean;
}) => {
  const { online } = useNetworkState();
  const pending = sync?.pendingOperationsCount ?? 0;
  const failed = useFailedOpsCount()?.count ?? 0;
  const label = syncLabel(sync, online);

  return (
    <span className="flex items-center min-w-0 gap-1.5">
      {/* The modal lives outside the drawer, so close the drawer first. */}
      <DrawerPrimitive.Close asChild>
        <button
          type="button"
          className="inline-flex items-center min-w-0 gap-1.5 text-xs rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${label}${pending > 0 ? `, ${pending} pending` : ""}. View sync details`}
          onClick={() => openSyncOperations()}
        >
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 rounded-full",
              syncDotClassName(sync, online)
            )}
          />
          {/* Only the label shortens on a narrow sidebar; the count stays. */}
          <span className="truncate underline decoration-dashed underline-offset-4">
            {label}
          </span>
          {pending > 0 && (
            <span className="underline shrink-0 tabular-nums decoration-dashed underline-offset-4">
              ({pending})
            </span>
          )}
        </button>
      </DrawerPrimitive.Close>
      {(failed > 0 || hasNotice) && (
        <DrawerPrimitive.Close asChild>
          <button
            type="button"
            className="text-xs leading-none rounded-sm shrink-0 animate-fade-in-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={
              failed > 0
                ? `${failed} ${failed === 1 ? "change" : "changes"} failed to sync. Review`
                : "Sync needs attention. View details"
            }
            title="Needs attention"
            onClick={() => openSyncOperations(failed > 0 ? "attention" : null)}
          >
            ‼️
          </button>
        </DrawerPrimitive.Close>
      )}
    </span>
  );
};
