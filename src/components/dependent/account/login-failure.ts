import { closeLoginDialog } from "@/lib/engine/login-dialog";
import { openRecoveryDialog } from "@/lib/engine/recovery-dialog";
import { copyForCode } from "@/lib/engine/engine-copy";

/**
 * What the login dialog shows for a failed auth call. `session_active` and
 * `local_cache_unreadable` are not errors to show: the first just closes the
 * dialog, the second hands over to the recovery dialog. Both return null.
 */
export const loginFailureMessage = (code: string): string | null => {
  if (code === "session_active") {
    closeLoginDialog();
    return null;
  }
  if (code === "local_cache_unreadable") {
    closeLoginDialog();
    openRecoveryDialog();
    return null;
  }
  return copyForCode(code);
};
