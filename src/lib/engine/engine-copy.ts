import type { WriteBlocker } from "./use-account-status";

/**
 * User-facing copy for engine error codes and write blockers, in one place
 * (design doc section 6). Unknown codes fall back to a generic message.
 */
const CODE_COPY: Record<string, string> = {
  stale_session: "Go online to continue.",
  premium_lapsed: "Your account can't save changes right now.",
  outbox_full:
    "Saving is paused until this device syncs. Go online to continue.",
  outbox_stale:
    "Saving is paused until this device syncs. Go online to continue.",
  cache_rebuilding: "Downloading your data…",
  storage_quota: "Your device is out of storage.",
  authentication_failed: "That code is wrong or expired.",
  network_error: "Can't reach the server. Check your connection and try again.",
  rate_limited: "Too many attempts. Wait a minute and try again.",
  temporarily_unavailable: "The server is busy. Try again in a moment.",
  malformed_response: "Something went wrong. Try again.",
  session_active: "You're already logged in.",
  local_cache_unreadable: "This device's saved data couldn't be opened.",
  no_active_session: "Log in to save your progress.",
  validation_failed: "This is too long to save.",
  unknown_operation_error: "Something went wrong.",
  pile_item_exists: "Already in your review pile.",
  unsupported_kanji: "This kanji can't be saved.",
  review_handle_expired: "This review timed out. Skipping it.",
  review_handle_consumed: "This card was already graded.",
  schema_version_mismatch: "Refresh the app to keep reviewing.",
  sync_failed: "Sync failed. Try again.",
  catch_up_required: "Refreshing your data…",
};

const BLOCKER_COPY: Record<WriteBlocker, string> = {
  loading: "Loading…",
  unavailable: "Saving isn't available here.",
  "signed-out": "Log in to save your progress.",
  recovery: "This device's saved data needs attention.",
  outbox_full: CODE_COPY.outbox_full,
  outbox_stale: CODE_COPY.outbox_stale,
  premium_lapsed: CODE_COPY.premium_lapsed,
  storage_quota: CODE_COPY.storage_quota,
  cache_rebuilding: CODE_COPY.cache_rebuilding,
};

export const UPDATE_BROWSER_COPY =
  "This browser can't save your progress. Update iOS, iPadOS, macOS or your browser to log in.";

export const NOT_IN_BUILD_COPY = "Not available in this build.";

export const ENGINE_FAILED_COPY =
  "Your progress couldn't be loaded. Refresh the page to try again.";

export const PUSH_BLOCKED_COPY =
  "Changes from this device can't upload. Log out and remove this device's data to fix it.";

export const OLD_PENDING_COPY =
  "Some changes have been waiting to upload for over a week. Go online and sync soon, or saving will be paused.";

export const REVIEW_SETTINGS_UPDATE_COPY =
  "Refresh the app to update review settings.";

export const UNSYNCED_LOGOUT_COPY =
  "You have unsynced changes. They stay on this device for now, but may be deleted when the cache expires or another account needs space. Sync before logging out to avoid losing them.";

/** Message for an engine `{ code }` error, with a generic fallback. */
export const copyForCode = (code: string): string =>
  CODE_COPY[code] ?? "Something went wrong. Try again.";

export const copyForWriteBlocker = (blocker: WriteBlocker): string =>
  BLOCKER_COPY[blocker];
