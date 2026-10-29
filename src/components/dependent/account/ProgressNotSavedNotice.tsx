import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { cn } from "@/lib/utils";
import { cnWarningText } from "@/lib/generic-cn";
import { PREMIUM_LAPSED_COPY } from "@/lib/engine/engine-copy";
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

/**
 * End-of-round notice, shown below the round's main buttons. Says why nothing
 * was saved (logged out, or a browser that can't save), or shows `saveError`
 * in bold yellow when the account is active but the write failed. Renders
 * nothing when all is well or when this build has no accounts.
 */
export const ProgressNotSavedNotice = ({
  saveError,
  className,
}: {
  /** Copy for the failed write, from copyForCode(). */
  saveError?: string | null;
  className?: string;
}) => {
  const account = useAccountStatus();

  if (account.kind === "signed-out") {
    return (
      <UserNotice className={cn("text-center", className)}>
        Not saved. <NoticeAction onClick={openLoginDialog}>Log in</NoticeAction>{" "}
        to save your rounds.
      </UserNotice>
    );
  }
  if (account.kind === "unavailable" && account.reason !== "not-included") {
    return <BrowserCantSaveNotice className={cn("text-center", className)} />;
  }
  if (account.kind === "active" && saveError) {
    return (
      <p className={cn("text-sm text-center", cnWarningText, className)}>
        {saveError}
        {saveError === PREMIUM_LAPSED_COPY && (
          <>
            {" "}
            <WriteBlockedLearnMore />
          </>
        )}
      </p>
    );
  }
  return null;
};
