import {
  copyForWriteBlocker,
  REVIEW_SETTINGS_UPDATE_COPY,
} from "@/lib/engine/engine-copy";
import {
  getWriteBlocker,
  type AccountStatus,
} from "@/lib/engine/use-account-status";

/** Why a round can't start for this account, or null when it can. */
export const getMasteryBlocker = (
  status: Extract<AccountStatus, { kind: "active" }>
): string | null => {
  if (status.reviewSettings.status === "update_required") {
    return REVIEW_SETTINGS_UPDATE_COPY;
  }
  const blocker = getWriteBlocker(status);
  return blocker ? copyForWriteBlocker(blocker) : null;
};
