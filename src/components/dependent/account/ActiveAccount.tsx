import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "@/components/ui/button";
import { useAccountEmail } from "@/lib/engine/account-email";
import { openLogoutDialog } from "@/lib/engine/logout-flow";
import { useSyncStatus } from "@/lib/engine/sync-queries";
import type { AccountStatus } from "@/lib/engine/use-account-status";
import { AccountCard } from "./AccountCard";
import { hasOldPendingChanges } from "./old-pending";
import { SyncStatusLine } from "./SyncStatusLine";

/**
 * Sidebar card for a logged-in account: who, sync state and logout. Sync
 * problems and account notices live in the sync details modal; the status
 * line only flags them with a ‼️.
 */
export const ActiveAccount = ({
  status,
  tools,
}: {
  status: Extract<AccountStatus, { kind: "active" }>;
  tools: ReactNode;
}) => {
  const email = useAccountEmail();
  const sync = useSyncStatus();
  const name = email ?? status.userId;
  const hasNotice =
    !status.writeAccess.allowed ||
    sync?.pushBlocked === true ||
    status.reviewSettings.status === "update_required" ||
    hasOldPendingChanges(sync);

  return (
    <AccountCard
      name={name}
      initial={name.charAt(0).toUpperCase() || null}
      status={<SyncStatusLine sync={sync} hasNotice={hasNotice} />}
      tools={tools}
      actions={
        // The modal lives outside the drawer, so close the drawer first.
        <DrawerPrimitive.Close asChild>
          <Button
            variant="outline"
            size="iconXl"
            aria-label="Log out"
            title="Log out"
            onClick={() => openLogoutDialog(status.userId)}
          >
            <LogOut className="w-[1.2rem] h-[1.2rem]" />
          </Button>
        </DrawerPrimitive.Close>
      }
    />
  );
};
