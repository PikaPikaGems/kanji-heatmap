import type { EngineUnavailableReason } from "./engine";
import type { AccountStatus } from "./use-account-status";

/**
 * True when the engine is missing from this build or crashed while loading:
 * account features should not show at all. Browsers that are merely too old
 * are not "absent"; those surfaces show UPDATE_BROWSER_COPY instead.
 */
export const isEngineAbsent = (reason: EngineUnavailableReason): boolean =>
  reason === "not-included" || reason === "failed";

export const isAccountUiHidden = (status: AccountStatus): boolean =>
  status.kind === "unavailable" && isEngineAbsent(status.reason);
