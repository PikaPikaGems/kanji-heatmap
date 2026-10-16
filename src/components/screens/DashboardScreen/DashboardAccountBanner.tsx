import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { LoginNotice } from "@/components/dependent/account/LoginNotice";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import { openRecoveryDialog } from "@/lib/engine/recovery-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";

/**
 * Tells why the dashboard below shows an empty account: logged out, a
 * browser that can't save progress, or an account that can't be read right
 * now. Renders nothing while loading or logged in.
 */
export const DashboardAccountBanner = () => {
  const account = useAccountStatus();

  if (account.kind === "signed-out") {
    return <LoginNotice to="see your progress" className="text-center" />;
  }
  if (account.kind === "unavailable") {
    return (
      <UserNotice className="text-center">{UPDATE_BROWSER_COPY}</UserNotice>
    );
  }
  if (account.kind === "recovery") {
    return (
      <UserNotice className="text-center">
        This device&apos;s saved data needs attention.{" "}
        <NoticeAction onClick={openRecoveryDialog}>Fix it</NoticeAction> to see
        your progress.
      </UserNotice>
    );
  }
  if (account.kind === "error") {
    return (
      <UserNotice className="text-center">
        Your progress isn&apos;t available right now.
      </UserNotice>
    );
  }
  return null;
};
