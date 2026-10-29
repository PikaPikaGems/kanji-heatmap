import type { SyncStatus } from "engine-contract";
import { Drawer as DrawerPrimitive } from "vaul";
import { useNetworkState } from "@/hooks/use-network-state";
import { openSyncOperations } from "@/lib/engine/sync-operations-dialog";
import { useFailedOpsCount } from "@/lib/engine/sync-queries";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import { syncDotClassName, syncLabel } from "./sync-display";

/**
 * The status line under the account name: "● Synced just now (2)", with the
 * pending count in brackets. When something needs a look (failed changes,
 * or a notice such as premium lapsed) the dot turns red and the text bold
 * yellow. It opens the sync details modal (design 5.7), on Needs attention
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
  const needsAttention = failed > 0 || hasNotice;
  const label = syncLabel(sync, online);
  const text = pending > 0 ? `${label} (${pending})` : label;

  return (
    // The modal lives outside the drawer, so close the drawer first.
    <DrawerPrimitive.Close asChild>
      <button
        type="button"
        className={cn(
          "inline-flex items-center self-start gap-1.5 text-xs text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          needsAttention
            ? cnWarningText
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label={`${label}${pending > 0 ? `, ${pending} pending` : ""}${needsAttention ? ", needs attention" : ""}. View sync details`}
        onClick={() => openSyncOperations(failed > 0 ? "attention" : null)}
      >
        <span
          aria-hidden
          className={cn(
            "size-2 shrink-0 rounded-full",
            needsAttention ? "bg-red-500" : syncDotClassName(sync, online)
          )}
        />
        <span className="underline decoration-dashed underline-offset-4 tabular-nums">
          {text}
        </span>
      </button>
    </DrawerPrimitive.Close>
  );
};
