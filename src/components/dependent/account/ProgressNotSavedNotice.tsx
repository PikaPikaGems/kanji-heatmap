import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { cn } from "@/lib/utils";

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
        You&apos;re not logged in, so this round wasn&apos;t saved.{" "}
        <NoticeAction onClick={openLoginDialog}>Log in</NoticeAction> to save
        your next rounds.
      </UserNotice>
    );
  }
  if (account.kind === "unavailable" && account.reason !== "not-included") {
    return <BrowserCantSaveNotice className={cn("text-center", className)} />;
  }
  if (account.kind === "active" && saveError) {
    return (
      <p
        className={cn(
          "text-sm font-bold text-center text-yellow-600 dark:text-yellow-400",
          className
        )}
      >
        {saveError}
      </p>
    );
  }
  return null;
};
