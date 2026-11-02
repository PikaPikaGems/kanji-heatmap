import type { SyncStatus } from "engine-contract";
import type { DataDownload } from "@/lib/engine/data-download";
import { relativeTime } from "@/lib/engine/relative-time";

/** The server asked for a full data refresh; `sync.catchUp()` does it. */
export const needsDataRefresh = (sync: SyncStatus | undefined) =>
  sync?.state === "failed" && sync.error.code === "catch_up_required";

/**
 * Changes are waiting but no sync round is running. Rounds take a moment and
 * the app starts the next one a little after (or a minute after, when
 * uploads keep failing), so this is what shows most of the time while
 * changes wait; `lastSyncedAt` only says the last round finished.
 */
const waitingToUpload = (sync: SyncStatus) =>
  sync.state === "idle" && sync.pendingOperationsCount > 0;

/**
 * Sync state as the sidebar chip and the operations modal word it. The
 * account's data not being downloaded comes first, as everywhere else.
 */
export const syncLabel = (
  sync: SyncStatus | undefined,
  online: boolean,
  download: DataDownload = "ready"
) => {
  if (!online) return download === "ready" ? "Offline" : "Not downloaded";
  if (download === "downloading") return "Downloading…";
  if (download === "not-downloaded") return "Not downloaded";
  if (!sync || sync.state === "syncing") return "Syncing…";
  if (sync.state === "failed") {
    // The app refreshes its data on its own for this one.
    return sync.error.code === "catch_up_required" ? "Syncing…" : "Sync failed";
  }
  if (waitingToUpload(sync)) return "Waiting to sync";
  if (sync.lastSyncedAt === undefined) return "Not synced yet";
  return `Synced ${relativeTime(sync.lastSyncedAt)}`;
};

/**
 * The sidebar chip's wording, short enough to fit beside the avatar: as
 * `syncLabel`, but "No data" for data not downloaded and "Unsynced" for
 * changes waiting (like the Unsynced changes dialog it opens). Offline it
 * says what's saved ("Synced 3 h ago", "Unsynced"), since the Online /
 * Offline chip sits right below it.
 */
export const syncChipLabel = (
  sync: SyncStatus | undefined,
  online: boolean,
  download: DataDownload
) => {
  if (download === "not-downloaded") return "No data";
  if (sync && sync.state === "idle" && sync.pendingOperationsCount > 0) {
    return "Unsynced";
  }
  if (online || download !== "ready" || !sync) {
    return syncLabel(sync, online, download);
  }
  if (sync.pendingOperationsCount > 0) return "Unsynced";
  if (sync.lastSyncedAt === undefined) return "Not synced yet";
  return `Synced ${relativeTime(sync.lastSyncedAt)}`;
};

export const syncDotClassName = (
  sync: SyncStatus | undefined,
  online: boolean,
  download: DataDownload = "ready"
) => {
  if (download === "not-downloaded") return "bg-destructive";
  if (!online) return "bg-muted-foreground";
  if (download === "downloading") return "bg-amber-500 animate-pulse";
  if (!sync || sync.state === "syncing") return "bg-amber-500 animate-pulse";
  if (sync.state === "failed") return "bg-destructive";
  if (waitingToUpload(sync)) return "bg-amber-500";
  if (sync.lastSyncedAt === undefined) return "bg-muted-foreground";
  return "bg-green-500";
};
