import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { cn } from "@/lib/utils";

/**
 * The one logged-out notice, used everywhere: "⚠️ You're not logged in.
 * Log in to {to}." where "Log in" opens the login dialog. Phones get the
 * short form, "Log in to {to}." The caller decides when to show it (only
 * while signed out).
 */
export const LoginNotice = ({
  to,
  className,
}: {
  /** What logging in lets them do, e.g. "save your progress". */
  to: string;
  className?: string;
}) => (
  <>
    <UserNotice className={cn("hidden sm:block", className)}>
      You&apos;re not logged in.{" "}
      <NoticeAction onClick={openLoginDialog}>Log in</NoticeAction> to {to}.
    </UserNotice>
    <UserNotice icon={null} className={cn("sm:hidden", className)}>
      <NoticeAction onClick={openLoginDialog}>Log in</NoticeAction> to {to}.
    </UserNotice>
  </>
);
