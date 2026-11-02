import type { SyncStatus } from "engine-contract";
import { ChevronRight } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { useNetworkState } from "@/hooks/use-network-state";
import type { DataDownload } from "@/lib/engine/data-download";
import { openSyncOperations } from "@/lib/engine/sync-operations-dialog";
import { useFailedOpsCount } from "@/lib/engine/sync-queries";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import { syncChipLabel, syncDotClassName } from "./sync-display";

/**
 * The sync chip under the account name, a pill like the Online chip: "●
 * Synced just now ›", or "● Waiting to sync (2) ›" with the pending count in
 * brackets. When something needs a look (data not downloaded, failed
 * changes, or a notice such as premium lapsed) the dot turns red and the
 * text bold yellow; an account that can't save says so instead of the sync
 * state (`problem`), the same first reason the bottom banner gives. It opens the sync details modal (design 5.7), on Needs
 * attention when changes failed.
 */
export const SyncStatusLine = ({
  sync,
  download,
  problem,
  hasNotice,
}: {
  sync: SyncStatus | undefined;
  download: DataDownload;
  /** Shown instead of the sync state, e.g. "Can't save". */
  problem: string | null;
  /** A warning the modal shows (not downloaded, write blocked, …). */
  hasNotice: boolean;
}) => {
  const { online } = useNetworkState();
  const pending = sync?.pendingOperationsCount ?? 0;
  const failed = useFailedOpsCount()?.count ?? 0;
  const needsAttention = failed > 0 || hasNotice;
  const label = problem ?? syncChipLabel(sync, online, download);
  const text = pending > 0 && !problem ? `${label} (${pending})` : label;

  return (
    // The modal lives outside the drawer, so close the drawer first.
    <DrawerPrimitive.Close asChild>
      <button
        type="button"
        className={cn(
          "inline-flex items-center self-start max-w-full gap-1 py-px pl-1.5 pr-1 mt-1 text-[11px] border rounded-full whitespace-nowrap transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          needsAttention
            ? cnWarningText
            : "font-semibold text-muted-foreground hover:text-foreground"
        )}
        aria-label={`${label}${pending > 0 ? `, ${pending} pending` : ""}${needsAttention ? ", needs attention" : ""}. View sync details`}
        onClick={() => openSyncOperations(failed > 0 ? "attention" : null)}
      >
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            needsAttention
              ? "bg-red-500"
              : syncDotClassName(sync, online, download)
          )}
        />
        <span className="truncate tabular-nums">{text}</span>
        <ChevronRight aria-hidden className="size-3 shrink-0 opacity-70" />
      </button>
    </DrawerPrimitive.Close>
  );
};
