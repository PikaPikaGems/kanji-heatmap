import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { isAccountUiHidden } from "@/lib/engine/account-ui";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { DashboardPanel } from "./DashboardPanel";
import { PanelNotice } from "./PanelNotice";

/**
 * A dashboard panel whose data lives in the account. `children` mount only
 * when logged in; otherwise the panel shows a log in prompt or the update
 * browser message. Builds without the engine hide the panel entirely.
 */
export const AccountGatedPanel = ({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) => {
  const account = useAccountStatus();

  if (isAccountUiHidden(account)) return null;
  if (account.kind === "unavailable") {
    return (
      <DashboardPanel title={title} defaultOpen={defaultOpen}>
        <PanelNotice>{UPDATE_BROWSER_COPY}</PanelNotice>
      </DashboardPanel>
    );
  }
  if (account.kind === "signed-out") {
    return (
      <DashboardPanel title={title} defaultOpen={defaultOpen}>
        <PanelNotice>
          <p>Log in to see your progress.</p>
          <Button variant="outline" size="sm" onClick={openLoginDialog}>
            Log in
          </Button>
        </PanelNotice>
      </DashboardPanel>
    );
  }
  if (account.kind === "error" || account.kind === "recovery") {
    return (
      <DashboardPanel title={title} defaultOpen={defaultOpen}>
        <PanelNotice>Your progress isn&apos;t available right now.</PanelNotice>
      </DashboardPanel>
    );
  }
  if (account.kind === "loading") {
    return (
      <DashboardPanel title={title} defaultOpen={defaultOpen}>
        {null}
      </DashboardPanel>
    );
  }
  return (
    <DashboardPanel title={title} defaultOpen={defaultOpen}>
      {children}
    </DashboardPanel>
  );
};
