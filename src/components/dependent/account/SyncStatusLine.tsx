import type { SyncStatus } from "engine-contract";
import { Drawer as DrawerPrimitive } from "vaul";
import { useNetworkState } from "@/hooks/use-network-state";
import { openSyncOperations } from "@/lib/engine/sync-operations-dialog";
import { useFailedOpsCount } from "@/lib/engine/sync-queries";
import { cn } from "@/lib/utils";
import { syncDotClassName, syncLabel } from "./sync-display";
import { cnWarningText } from "@/lib/generic-cn";

/**
 * The status line under the account name: "● Synced just now · 2 pending".
 * Opens the pending / failed operations modal (design 5.7).
 */
export const SyncStatusLine = ({ sync }: { sync: SyncStatus | undefined }) => {
  const { online } = useNetworkState();
  const pending = sync?.pendingOperationsCount ?? 0;
  const label = syncLabel(sync, online);

  return (
    // The modal lives outside the drawer, so close the drawer first.
    <DrawerPrimitive.Close asChild>
      <button
        type="button"
        className="inline-flex items-center self-start gap-1.5 text-xs rounded-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4 decoration-dotted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <span className="truncate">
          {label}
          {pending > 0 && ` · ${pending} pending`}
        </span>
      </button>
    </DrawerPrimitive.Close>
  );
};

/**
 * "⚠️ 2 changes failed to sync. Review" under the name row; nothing while
 * none failed. Review opens the modal on Needs attention.
 */
export const SyncFailures = () => {
  const failed = useFailedOpsCount()?.count ?? 0;
  if (failed === 0) return null;

  return (
    <p className={cn("text-xs", cnWarningText)}>
      ⚠️ {failed} {failed === 1 ? "change" : "changes"} failed to sync.{" "}
      <DrawerPrimitive.Close asChild>
        <button
          type="button"
          className="underline rounded-sm underline-offset-4 decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => openSyncOperations("attention")}
        >
          Review
        </button>
      </DrawerPrimitive.Close>
    </p>
  );
};
