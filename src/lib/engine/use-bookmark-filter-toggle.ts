import { isAccountUiHidden } from "./account-ui";
import { useAccountStatus } from "./use-account-status";

/**
 * Whether to show a "Bookmarked only" switch: hidden only when this build has
 * no study engine (bookmarks live in the account). Logged out, it still works;
 * no kanji are bookmarked, so none match.
 */
export const useShowBookmarkFilterToggle = (): boolean =>
  !isAccountUiHidden(useAccountStatus());
