import type { SyncStatus } from "engine-contract";
import { relativeTime } from "@/lib/engine/relative-time";

/** The server asked for a full data refresh; `sync.catchUp()` does it. */
export const needsDataRefresh = (sync: SyncStatus | undefined) =>
  sync?.state === "failed" && sync.error.code === "catch_up_required";

/** Sync state as the chip and the operations modal word it. */
export const syncLabel = (sync: SyncStatus | undefined, online: boolean) => {
  if (!online) return "Offline";
  if (!sync || sync.state === "syncing") return "Syncing…";
  if (sync.state === "failed") {
    // The app refreshes its data on its own for this one.
    return sync.error.code === "catch_up_required" ? "Syncing…" : "Sync failed";
  }
  if (sync.lastSyncedAt === undefined) return "Not synced yet";
  return `Synced ${relativeTime(sync.lastSyncedAt)}`;
};

export const syncDotClassName = (
  sync: SyncStatus | undefined,
  online: boolean
) => {
  if (!online) return "bg-muted-foreground";
  if (!sync || sync.state === "syncing") return "bg-amber-500 animate-pulse";
  if (sync.state === "failed") return "bg-destructive";
  if (sync.lastSyncedAt === undefined) return "bg-muted-foreground";
  return "bg-green-500";
};
