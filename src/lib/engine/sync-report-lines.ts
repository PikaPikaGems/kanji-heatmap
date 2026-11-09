import type { RecentFailedOperation, SyncStatus } from "engine-contract";
import type { AccountStatus } from "./use-account-status";

/**
 * Account and sync state as plain-text lines for the reports people copy and
 * send us (unsaved answers, Couldn't sync, Couldn't download).
 */
/** `email` is the one last used to log in on this device, if remembered. */
export const accountLines = (
  account: AccountStatus,
  email: string | null
): string[] => {
  if (account.kind !== "active") return [`Account: ${account.kind}`];
  const write = account.writeAccess.allowed
    ? "allowed"
    : `blocked (${account.writeAccess.reason})`;
  return [
    "Account: active",
    `Email: ${email ?? "not remembered on this device"}`,
    `User ID: ${account.userId}`,
    `Write access: ${write}`,
    `Review settings: ${account.reviewSettings.status}`,
    `Session expires: ${new Date(account.expiresAt).toISOString()}`,
  ];
};

export const syncLines = (
  sync: SyncStatus | undefined,
  failedOps: number | undefined
): string[] => {
  const online = `Browser online: ${navigator.onLine ? "yes" : "no"}`;
  if (!sync) return ["Sync: not loaded", online];
  const lines = [
    online,
    `Sync: ${sync.state}${sync.state === "failed" ? ` (${sync.error.code})` : ""}`,
    ...("mode" in sync ? [`Sync mode: ${sync.mode}`] : []),
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

/** At most this many failed operations in a report, newest first. */
const MAX_FAILED_LINES = 20;

/**
 * Failed operations without the user's own text (no `payload`): what, which
 * kanji, why, and the diagnostic id to look up on our side.
 */
export const failedOperationLines = (
  operations: readonly RecentFailedOperation[] | undefined
): string[] => {
  if (!operations) return ["Failed operations: not loaded"];
  const newestFirst = [...operations].sort((a, b) => b.failedAt - a.failedAt);
  return [
    `Failed operations (${operations.length})`,
    ...newestFirst
      .slice(0, MAX_FAILED_LINES)
      .map((op) =>
        [
          op.operationType,
          op.subject?.kanji ?? op.subject?.activityType ?? "-",
          op.code,
          op.state,
          op.diagnosticId ?? "no diagnostic id",
          new Date(op.failedAt).toISOString(),
        ].join(" · ")
      ),
    ...(operations.length > MAX_FAILED_LINES
      ? [`…and ${operations.length - MAX_FAILED_LINES} more`]
      : []),
  ];
};
