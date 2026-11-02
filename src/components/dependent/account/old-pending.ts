import type { SyncStatus } from "engine-contract";
import { OLD_PENDING_MS } from "@/components/dependent/sync-operations/SyncHeader";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { useSyncStatus } from "@/lib/engine/sync-queries";

/** True when changes have waited over a week to upload (the same rule as the operations modal). */
export const hasOldPendingChanges = (sync: SyncStatus | undefined) =>
  (sync?.oldestPendingOperationAgeMs ?? 0) > OLD_PENDING_MS;

/**
 * Whether to show the app-wide "changes haven't synced in a week" warning:
 * only with an active account, so never in a build without the engine.
 */
export const useHasOldPendingChanges = () => {
  const status = useAccountStatus();
  const sync = useSyncStatus();
  return status.kind === "active" && hasOldPendingChanges(sync);
};
