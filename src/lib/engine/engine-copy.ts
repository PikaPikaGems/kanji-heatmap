import type { WriteBlocker } from "./use-account-status";

/**
 * User-facing copy for engine error codes and write blockers, in one place
 * (design doc section 6). Unknown codes fall back to a generic message.
 */
const CODE_COPY: Record<string, string> = {
  stale_session: "Go online to continue.",
  entitlement_expired: "Your account can't save changes right now.",
  outbox_full:
    "Saving is paused: too many changes are waiting to upload. Go online and sync to continue.",
  outbox_stale:
    "Saving is paused: some changes haven't uploaded for too long. Go online and sync to continue.",
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
  entitlement_expired: CODE_COPY.entitlement_expired,
  storage_quota: CODE_COPY.storage_quota,
  cache_rebuilding: CODE_COPY.cache_rebuilding,
  "not-downloaded": "Your data hasn't downloaded yet.",
};

/** UPDATE_BROWSER_COPY in two parts, for a notice card's title and line. */
export const UPDATE_BROWSER_TITLE_COPY =
  "This browser can't save your progress.";
export const UPDATE_BROWSER_DETAIL_COPY =
  "Update iOS, iPadOS, macOS or your browser to log in.";
export const UPDATE_BROWSER_COPY = `${UPDATE_BROWSER_TITLE_COPY} ${UPDATE_BROWSER_DETAIL_COPY}`;

export const NOT_IN_BUILD_COPY = "Not available in this build.";

/**
 * A failed engine logout step. The server call is best effort and the local
 * logout goes ahead without it (RUNTIME.md "Offline logout"), so a failure
 * here is a problem on this device, never the network.
 */
export const LOGOUT_FAILED_COPY =
  "This device couldn't finish logging you out. Try again. If it keeps happening, reload the page.";

/** ENGINE_FAILED_COPY in two parts, for a notice card's title and line. */
export const ENGINE_FAILED_TITLE_COPY = "Your progress couldn't be loaded.";
export const ENGINE_FAILED_DETAIL_COPY = "Refresh the page to try again.";
export const ENGINE_FAILED_COPY = `${ENGINE_FAILED_TITLE_COPY} ${ENGINE_FAILED_DETAIL_COPY}`;

/** `action` ("Log out") is an inline button in the sentence that opens the logout dialog. */
export const PUSH_BLOCKED_COPY = {
  before: "Changes from this device can't upload. ",
  action: "Log out",
  after: " and remove the cached study data on this device to fix it.",
};

/** "Sync now" reached the server, but changes are still waiting to upload. */
export const SYNC_INCOMPLETE_COPY = "Some changes couldn't upload.";

export const OLD_PENDING_COPY =
  "Some changes have been waiting to upload for over a week. Go online and sync soon, or saving will be paused.";

export const REVIEW_SETTINGS_UPDATE_COPY =
  "Refresh the app to update review settings.";

/** Message for an engine `{ code }` error, with a generic fallback. */
export const copyForCode = (code: string): string =>
  CODE_COPY[code] ?? "Something went wrong. Try again.";

/** "Your account can't save changes right now.", the entitlement-expired copy. */
export const ENTITLEMENT_EXPIRED_COPY = CODE_COPY.entitlement_expired;

export const copyForWriteBlocker = (blocker: WriteBlocker): string =>
  BLOCKER_COPY[blocker];

/**
 * The bottom banner, short enough for one line on phones ("Learn more",
 * "Try again" or GO_ONLINE_BANNER_COPY follows).
 */
export const SYNC_SOON_BANNER_COPY = "Please sync soon.";
export const SAVING_PAUSED_BANNER_COPY = "Saving is paused.";
export const DATA_NOT_DOWNLOADED_BANNER_COPY = "Data not downloaded.";
export const ACCOUNT_CANT_SAVE_BANNER_COPY = "Account can't save.";
export const GO_ONLINE_BANNER_COPY = "Please go online.";

/**
 * Why a practice round isn't saved, finishing "You can play, but your rounds
 * won't be saved: …" (start screen) and "Not saved: …" (end screen).
 */
const NOT_SAVED_REASON_COPY: Partial<Record<WriteBlocker, string>> = {
  "signed-out": "you're not logged in.",
  "not-downloaded": "your data hasn't downloaded yet.",
  cache_rebuilding: "your data hasn't downloaded yet.",
  entitlement_expired: "your account can't save changes right now.",
  outbox_full: "saving is paused until this device syncs.",
  outbox_stale: "saving is paused until this device syncs.",
  recovery: "this device's saved data needs attention.",
  storage_quota: "your device is out of storage.",
};

export const notSavedReasonCopy = (blocker: WriteBlocker): string =>
  NOT_SAVED_REASON_COPY[blocker] ?? "saving isn't available right now.";

/** Why the account's data didn't download, by engine error code. */
const DOWNLOAD_ERROR_COPY: Record<string, string> = {
  network_error: "Can't reach the server. Check your connection.",
  rate_limited: "Too many attempts. Wait a minute.",
  temporarily_unavailable: "The server is busy right now.",
  storage_quota: CODE_COPY.storage_quota,
  local_cache_unreadable: CODE_COPY.local_cache_unreadable,
};

export const copyForDownloadError = (code: string): string =>
  DOWNLOAD_ERROR_COPY[code] ?? "The download didn't finish.";

/** Whether `copy` is one of the saving-paused (outbox) messages. */
export const isSyncBlockerCopy = (copy: string | null): boolean =>
  copy === CODE_COPY.outbox_full || copy === CODE_COPY.outbox_stale;
