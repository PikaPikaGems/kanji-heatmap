import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { notSavedReasonCopy } from "@/lib/engine/engine-copy";
import { openRecoveryDialog } from "@/lib/engine/recovery-dialog";
import type { SaveError } from "@/lib/engine/use-activity-recorder";
import {
  isSyncBlocker,
  useAccountStatus,
  type WriteBlocker,
} from "@/lib/engine/use-account-status";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import { DownloadNowAction } from "./DownloadNow";
import { SyncNowAction } from "./SyncNowAction";
import { WriteBlockedLearnMore } from "./WriteBlockedDialog";

/** "Progress can't be saved in this browser", for browsers the engine can't run in. */
export const BrowserCantSaveNotice = ({
  className,
}: {
  className?: string;
}) => (
  <UserNotice className={className}>
    Progress can&apos;t be saved in this browser.
  </UserNotice>
);

/** The fix for a write blocker, when there is one the user can do. */
const BlockerFix = ({ blocker }: { blocker: WriteBlocker }) => {
  if (blocker === "signed-out") {
    return <NoticeAction onClick={openLoginDialog}>Log in</NoticeAction>;
  }
  if (blocker === "not-downloaded" || blocker === "cache_rebuilding") {
    return <DownloadNowAction />;
  }
  if (blocker === "entitlement_expired") return <WriteBlockedLearnMore />;
  if (isSyncBlocker(blocker)) return <SyncNowAction />;
  if (blocker === "recovery") {
    return <NoticeAction onClick={openRecoveryDialog}>Fix it</NoticeAction>;
  }
  return null;
};

/**
 * A round that isn't saved because of `blocker`, in bold yellow: "<before>
 * <reason> <fix>", e.g. "Not saved: your data hasn't downloaded yet.
 * Download now". The game start and end screens share it.
 */
export const NotSavedLine = ({
  before,
  blocker,
  className,
}: {
  before: string;
  blocker: WriteBlocker;
  className?: string;
}) => (
  <p
    className={cn("text-sm text-center text-pretty", cnWarningText, className)}
  >
    {before} {notSavedReasonCopy(blocker)} <BlockerFix blocker={blocker} />
  </p>
);

/**
 * End-of-round notice, shown below the round's main buttons, in bold yellow:
 * why nothing was saved (logged out, or `saveError` when the account is
 * active but the round wasn't saved), or that this browser can't save.
 * Renders nothing when all is well or when this build has no accounts.
 */
export const ProgressNotSavedNotice = ({
  saveError,
  className,
}: {
  saveError?: SaveError | null;
  className?: string;
}) => {
  const account = useAccountStatus();

  if (account.kind === "signed-out") {
    return (
      <NotSavedLine
        before="Not saved:"
        blocker="signed-out"
        className={className}
      />
    );
  }
  if (account.kind === "unavailable" && account.reason !== "not-included") {
    return <BrowserCantSaveNotice className={cn("text-center", className)} />;
  }
  if (account.kind !== "active" || !saveError) return null;
  if (saveError.kind === "blocked") {
    return (
      <NotSavedLine
        before="Not saved:"
        blocker={saveError.blocker}
        className={className}
      />
    );
  }
  return (
    <p className={cn("text-sm text-center", cnWarningText, className)}>
      {saveError.message}
    </p>
  );
};
