import type { SyncStatus } from "engine-contract";
import { OLD_PENDING_MS } from "@/components/dependent/sync-operations/SyncHeader";
import {
  type AccountStatus,
  useAccountStatus,
} from "@/lib/engine/use-account-status";
import { useSyncStatus } from "@/lib/engine/sync-queries";

/** True when changes have waited over a week to upload (the same rule as the operations modal). */
export const hasOldPendingChanges = (sync: SyncStatus | undefined) =>
  (sync?.oldestPendingOperationAgeMs ?? 0) > OLD_PENDING_MS;

/**
 * How urgently this device needs to sync, for the bottom banner and the Sync
 * now dialog's first step: saving paused (changes too old, or too many), or
 * changes over a week old ("soon"). Only with an active account, so never in
 * a build without the engine.
 */
export type SyncAttention = "none" | "soon" | "paused-stale" | "paused-full";

export const getSyncAttention = (
  status: AccountStatus,
  sync: SyncStatus | undefined
): SyncAttention => {
  if (status.kind !== "active") return "none";
  const { writeAccess } = status;
  if (!writeAccess.allowed && writeAccess.reason === "outbox_stale") {
    return "paused-stale";
  }
  if (!writeAccess.allowed && writeAccess.reason === "outbox_full") {
    return "paused-full";
  }
  return hasOldPendingChanges(sync) ? "soon" : "none";
};

export const useSyncAttention = () =>
  getSyncAttention(useAccountStatus(), useSyncStatus());
