import type { SyncStatus } from "engine-contract";
import { Drawer as DrawerPrimitive } from "vaul";
import { useNetworkState } from "@/hooks/use-network-state";
import { openSyncOperations } from "@/lib/engine/sync-operations-dialog";
import { useFailedOpsCount } from "@/lib/engine/sync-queries";
import { cn } from "@/lib/utils";
import { syncDotClassName, syncLabel } from "./sync-display";

/** "2 pending · ⚠️ 2 failed" under the pill; nothing when both are 0. */
const SyncCounts = ({
  pending,
  failed,
}: {
  pending: number;
  failed: number;
}) => {
  if (pending === 0 && failed === 0) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 px-1 text-xs">
      {pending > 0 && (
        <span className="text-muted-foreground">{pending} pending</span>
      )}
      {pending > 0 && failed > 0 && (
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
      )}
      {failed > 0 && (
        // The modal lives outside the drawer, so close the drawer first.
        <DrawerPrimitive.Close asChild>
          <button
            type="button"
            className="font-bold text-yellow-600 rounded-sm dark:text-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openSyncOperations("attention")}
          >
            {/* Only the words are underlined, not the emoji. */}
            ⚠️{" "}
            <span className="underline underline-offset-4">
              {failed} failed
            </span>
          </button>
        </DrawerPrimitive.Close>
      )}
    </p>
  );
};

/**
 * Sync state for the sidebar account row: the state pill (opens the pending /
 * failed operations modal, design 5.7) and, under it, how many changes are
 * pending and how many failed (opens the modal on Needs attention).
 */
export const SyncChip = ({ sync }: { sync: SyncStatus | undefined }) => {
  const { online } = useNetworkState();
  const failedCount = useFailedOpsCount()?.count ?? 0;
  const pendingCount = sync?.pendingOperationsCount ?? 0;
  const label = syncLabel(sync, online);

  return (
    <div className="flex flex-col items-start gap-1 pb-1.5">
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
        </button>
      </DrawerPrimitive.Close>
      <SyncCounts pending={pendingCount} failed={failedCount} />
    </div>
  );
};
