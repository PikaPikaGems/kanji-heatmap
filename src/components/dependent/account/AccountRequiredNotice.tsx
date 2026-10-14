import { Button } from "@/components/ui/button";
import {
  LOGIN_TO_ACCESS_COPY,
  UPDATE_BROWSER_TO_USE_COPY,
} from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import type { AccountStatus } from "@/lib/engine/use-account-status";

/**
 * Stands in for content that needs an active account. Renders nothing while
 * the account is loading or active: the caller shows its own content then.
 */
export const AccountRequiredNotice = ({
  status,
}: {
  status: AccountStatus;
}) => {
  if (status.kind === "signed-out") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-sm">
        <p>{LOGIN_TO_ACCESS_COPY}</p>
        <Button variant="outline" onClick={openLoginDialog}>
          Log in
        </Button>
      </div>
    );
  }
  if (status.kind === "unavailable") {
    return <p className="py-4 text-sm">{UPDATE_BROWSER_TO_USE_COPY}</p>;
  }
  if (status.kind === "error" || status.kind === "recovery") {
    return (
      <p className="py-4 text-sm">
        Your account data isn&apos;t available right now.
      </p>
    );
  }
  return null;
};
