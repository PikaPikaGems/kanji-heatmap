import type { SyncStatus } from "engine-contract";
import type { AccountStatus } from "./use-account-status";

/**
 * Account and sync state as plain-text lines for the reports people copy and
 * send us (unsaved answers, Couldn't sync).
 */
export const accountLines = (account: AccountStatus): string[] => {
  if (account.kind !== "active") return [`Account: ${account.kind}`];
  const write = account.writeAccess.allowed
    ? "allowed"
    : `blocked (${account.writeAccess.reason})`;
  return [
    "Account: active",
    `Write access: ${write}`,
    `Review settings: ${account.reviewSettings.status}`,
    `Session expires: ${new Date(account.expiresAt).toISOString()}`,
  ];
};

export const syncLines = (
  sync: SyncStatus | undefined,
  failedOps: number | undefined
): string[] => {
  if (!sync) return ["Sync: not loaded"];
  const lines = [
    `Sync: ${sync.state}${sync.state === "failed" ? ` (${sync.error.code})` : ""}`,
    ...(sync.state === "failed" && "diagnosticId" in sync.error
      ? [`Sync diagnostic id: ${sync.error.diagnosticId}`]
      : []),
    `Pending changes: ${sync.pendingOperationsCount}`,
    `Failed changes: ${failedOps ?? "not loaded"}`,
    `Upload blocked: ${sync.pushBlocked ? "yes" : "no"}`,
    `Server revision: ${sync.serverRevision}`,
    `Last synced: ${
      sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toISOString() : "never"
    }`,
  ];
  if (sync.oldestPendingOperationAgeMs != null) {
    const hours = sync.oldestPendingOperationAgeMs / 3_600_000;
    lines.push(`Oldest pending change: ${hours.toFixed(1)} h old`);
  }
  return lines;
};
