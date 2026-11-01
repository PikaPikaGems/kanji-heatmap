import { useState } from "react";
import type { RecentFailedOperation, SyncStatus } from "engine-contract";
import { Loader2 } from "lucide-react";
import { DialogActions } from "@/components/common/DialogActions";
import { needsDataRefresh } from "@/components/dependent/account/sync-display";
import { PracticeButton } from "@/components/ui/practice-button";
import { useNetworkState } from "@/hooks/use-network-state";
import { syncNow, useSyncNowState } from "@/lib/engine/sync-now-dialog";
import { useEngineApi } from "@/lib/engine/use-engine-query";

/**
 * The dialog's buttons, at the bottom of the modal: "Dismiss all (keeps
 * notes)" when the Needs attention tab has something to dismiss, and "Sync
 * now" (or "Refresh data") when it can help: online with changes waiting, or
 * a refresh needed. Sync now is the main action (primary), so it comes last.
 */
export const SyncActions = ({
  sync,
  dismissable,
  onDismissed,
}: {
  sync: SyncStatus | undefined;
  /** Failed operations "Dismiss all" removes; empty hides the button. */
  dismissable: readonly RecentFailedOperation[];
  onDismissed: () => void;
}) => {
  const api = useEngineApi();
  const { online } = useNetworkState();
  const syncNowState = useSyncNowState();
  const [dismissing, setDismissing] = useState(false);
  const syncing = syncNowState.open && syncNowState.status.kind === "syncing";
  const needsRefresh = needsDataRefresh(sync);
  const showSync =
    needsRefresh || (online && (sync?.pendingOperationsCount ?? 0) > 0);

  if (!showSync && dismissable.length === 0) return null;

  const dismissAll = async () => {
    if (!api || dismissing) return;
    setDismissing(true);
    await api.sync.dismissFailedOperations(
      dismissable.map((op) => op.operationId)
    );
    setDismissing(false);
    onDismissed();
  };

  return (
    <div className="flex flex-col gap-2 pt-4 border-t border-dotted">
      <DialogActions>
        {dismissable.length > 0 && (
          <PracticeButton
            variant="secondary"
            className="animate-fade-in-fast"
            disabled={!api}
            aria-busy={dismissing}
            onClick={() => void dismissAll()}
          >
            {dismissing && (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            )}
            Dismiss all (keeps notes)
          </PracticeButton>
        )}
        {showSync && (
          <PracticeButton
            // Not disabled while busy: a disabled button fades out.
            disabled={!api}
            aria-busy={syncing}
            // The Sync now dialog opens over this one and says how it went.
            onClick={() => {
              if (api && !syncing) void syncNow(api);
            }}
          >
            {syncing && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {needsRefresh ? "Refresh data" : "Sync now"}
          </PracticeButton>
        )}
      </DialogActions>
    </div>
  );
};
