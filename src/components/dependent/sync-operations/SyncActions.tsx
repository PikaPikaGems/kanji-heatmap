import { useState } from "react";
import type { RecentFailedOperation, SyncStatus } from "engine-contract";
import { Loader2 } from "lucide-react";
import { DialogActions } from "@/components/common/DialogActions";
import type { ActionStatus } from "@/components/dependent/account/action-status";
import { needsDataRefresh } from "@/components/dependent/account/sync-display";
import { PracticeButton } from "@/components/ui/practice-button";
import { useNetworkState } from "@/hooks/use-network-state";
import { copyForCode } from "@/lib/engine/engine-copy";
import { useEngineApi } from "@/lib/engine/use-engine-query";

/**
 * The dialog's buttons on one row: "Dismiss all (keeps notes)" when the
 * Needs attention tab has something to dismiss, and "Sync now" (or "Refresh
 * data") when it can help: online with changes waiting, or a refresh needed.
 * Sync now is the main action, so it comes last.
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
  const [syncStatus, setSyncStatus] = useState<ActionStatus>({ kind: "idle" });
  const [dismissing, setDismissing] = useState(false);
  const syncing = syncStatus.kind === "busy";
  const needsRefresh = needsDataRefresh(sync);
  const showSync =
    needsRefresh || (online && (sync?.pendingOperationsCount ?? 0) > 0);

  if (!showSync && dismissable.length === 0) return null;

  const syncNow = async () => {
    if (!api || syncing) return;
    setSyncStatus({ kind: "busy" });
    const result = await api.sync.catchUp();
    setSyncStatus(
      result.ok
        ? { kind: "idle" }
        : { kind: "error", message: copyForCode(result.error.code) }
    );
  };

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
    <div className="flex flex-col gap-2">
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
            variant="secondary"
            // Not disabled while busy: a disabled secondary button fades to 20%.
            disabled={!api}
            aria-busy={syncing}
            onClick={() => void syncNow()}
          >
            {syncing && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {needsRefresh ? "Refresh data" : "Sync now"}
          </PracticeButton>
        )}
      </DialogActions>
      {syncStatus.kind === "error" && (
        <p
          role="alert"
          className="text-sm font-bold text-yellow-600 sm:text-right dark:text-yellow-400"
        >
          ⚠️ {syncStatus.message}
        </p>
      )}
    </div>
  );
};
