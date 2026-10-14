import { ReactNode } from "react";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { DashboardPanel } from "./DashboardPanel";

/**
 * A dashboard panel whose data lives in the account. `children` mount only
 * when logged in; otherwise the panel shows a log in prompt or the update
 * browser message. Builds without the engine hide the panel entirely.
 */
export const AccountGatedPanel = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  const account = useAccountStatus();

  if (account.kind === "unavailable" && account.reason === "not-included") {
    return null;
  }
  if (account.kind === "unavailable") {
    return (
      <DashboardPanel title={title}>
        <p className="text-sm text-muted-foreground">{UPDATE_BROWSER_COPY}</p>
      </DashboardPanel>
    );
  }
  if (account.kind === "signed-out") {
    return (
      <DashboardPanel title={title}>
        <button
          type="button"
          onClick={openLoginDialog}
          className="text-sm font-bold underline underline-offset-4 text-muted-foreground hover:text-foreground"
        >
          Log in to see your progress
        </button>
      </DashboardPanel>
    );
  }
  if (account.kind !== "active") {
    return <DashboardPanel title={title}>{null}</DashboardPanel>;
  }
  return <DashboardPanel title={title}>{children}</DashboardPanel>;
};
