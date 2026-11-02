import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "@/components/ui/button";
import { useAccountEmail } from "@/lib/engine/account-email";
import { useDataDownload } from "@/lib/engine/data-download";
import { openLogoutDialog } from "@/lib/engine/logout-flow";
import { useSyncStatus } from "@/lib/engine/sync-queries";
import {
  type AccountStatus,
  getWriteBlocker,
  isSyncBlocker,
} from "@/lib/engine/use-account-status";
import { AccountCard } from "./AccountCard";
import { hasOldPendingChanges } from "./old-pending";
import { SyncStatusLine } from "./SyncStatusLine";

/**
 * Sidebar card for a logged-in account: who, sync state and logout. Sync
 * problems and account notices live in the sync details modal; the status
 * line turns red and yellow to flag them.
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
  const download = useDataDownload();
  const name = email ?? status.userId;
  const blocker = getWriteBlocker(status, download);
  // The data not downloaded already shows as the sync state.
  const problem =
    blocker === "entitlement_expired"
      ? "Can't save"
      : isSyncBlocker(blocker)
        ? "Saving paused"
        : null;
  const hasNotice =
    download === "not-downloaded" ||
    // Downloading isn't a problem: the chip already says "Downloading…".
    (!status.writeAccess.allowed &&
      status.writeAccess.reason !== "cache_rebuilding") ||
    sync?.pushBlocked === true ||
    status.reviewSettings.status === "update_required" ||
    hasOldPendingChanges(sync);

  return (
    <AccountCard
      name={name}
      initial={name.charAt(0).toUpperCase() || null}
      status={
        <SyncStatusLine
          sync={sync}
          download={download}
          problem={problem}
          hasNotice={hasNotice}
        />
      }
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
