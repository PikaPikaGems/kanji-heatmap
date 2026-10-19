import type { ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { LogIn } from "lucide-react";
import { PracticeButton } from "@/components/ui/practice-button";
import { NetworkStatusBadge } from "@/components/common/NetworkStatusBadge";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import { openRecoveryDialog } from "@/lib/engine/recovery-dialog";
import {
  hasNoAccounts,
  useAccountStatus,
  type AccountStatus,
} from "@/lib/engine/use-account-status";
import { AccountCard } from "./AccountCard";
import { ActiveAccount } from "./ActiveAccount";
import { FsrsSettingsItem } from "./FsrsSettingsItem";

/**
 * What stands in for the card while there is no account to show: an update
 * hint, a diagnostic, the recovery button, or nothing (loading).
 */
const NoCardNotice = ({ status }: { status: AccountStatus }) => {
  if (status.kind === "unavailable") {
    return (
      <p className="p-2 text-xs text-left border border-dashed rounded-xl text-muted-foreground">
        {UPDATE_BROWSER_COPY}
      </p>
    );
  }
  if (status.kind === "error") {
    return (
      <p className="text-[10px] text-muted-foreground">
        Account status unavailable ({status.diagnosticId})
      </p>
    );
  }
  if (status.kind === "recovery") {
    return (
      <DrawerPrimitive.Close asChild>
        <PracticeButton
          size="md"
          className="h-auto px-3 py-2 text-sm min-h-12"
          onClick={openRecoveryDialog}
        >
          Fix saved data on this device
        </PracticeButton>
      </DrawerPrimitive.Close>
    );
  }
  return null;
};

/** Dialogs the account area opens; the sidebar closes for them, then returns. */
export type AccountDialog = "login" | "fsrs";

const AccountBody = ({
  status,
  tools,
  onAction,
}: {
  status: AccountStatus;
  tools: ReactNode;
  onAction: (dialog: AccountDialog) => void;
}) => {
  const fsrsItem = <FsrsSettingsItem onClick={() => onAction("fsrs")} />;
  if (status.kind === "signed-out") {
    return (
      <AccountCard
        name="Guest"
        status={
          <span className="text-xs text-muted-foreground">Not logged in</span>
        }
        tools={
          <>
            {tools}
            {fsrsItem}
          </>
        }
      >
        <PracticeButton size="md" onClick={() => onAction("login")}>
          <LogIn aria-hidden />
          Log in
        </PracticeButton>
      </AccountCard>
    );
  }
  if (status.kind === "active") {
    return (
      <ActiveAccount
        status={status}
        tools={
          <>
            {tools}
            {fsrsItem}
          </>
        }
      />
    );
  }

  return (
    <>
      <NoCardNotice status={status} />
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {tools}
        <NetworkStatusBadge />
      </div>
    </>
  );
};

/**
 * Account area of the sidebar. `tools` are the icon buttons every build shows
 * (App & Device Info, User Preferences): they sit in the card's bottom row, or on
 * their own where the card would be while there is no account to show. Renders
 * nothing in a build without accounts (see `hasNoAccounts`).
 */
export const AccountSection = ({
  tools,
  onAction,
}: {
  tools: ReactNode;
  onAction: (dialog: AccountDialog) => void;
}) => {
  const status = useAccountStatus();
  if (hasNoAccounts(status)) return null;

  return (
    <div
      className="flex flex-col gap-2"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <AccountBody status={status} tools={tools} onAction={onAction} />
    </div>
  );
};
