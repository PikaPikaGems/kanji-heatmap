import { isAccountUiHidden } from "./account-ui";
import { type AccountStatus, useAccountStatus } from "./use-account-status";

export type BookmarkFilterToggle = {
  disabled: boolean;
  /** Short reason shown under a disabled toggle. */
  hint: string | null;
};

const hintFor = (status: AccountStatus): string | null => {
  if (status.kind === "loading") return null;
  if (status.kind === "signed-out") return "Log in to use bookmarks";
  if (status.kind === "unavailable") {
    return "Update your browser to use bookmarks";
  }
  return "Bookmarks aren't available right now";
};

/**
 * State for a "Bookmarked only" switch, or null when it should be hidden (no
 * engine in this build). Disabled unless the account is active; a switch that
 * is already on stays usable so it can be turned off.
 */
export const useBookmarkFilterToggle = (
  checked: boolean
): BookmarkFilterToggle | null => {
  const status = useAccountStatus();
  if (isAccountUiHidden(status)) return null;
  if (status.kind === "active" || checked) {
    return { disabled: false, hint: null };
  }
  return { disabled: true, hint: hintFor(status) };
};
