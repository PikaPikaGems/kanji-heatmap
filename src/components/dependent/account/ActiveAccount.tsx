import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "@/components/ui/button";
import {
  copyForWriteBlocker,
  PUSH_BLOCKED_COPY,
  REVIEW_SETTINGS_UPDATE_COPY,
} from "@/lib/engine/engine-copy";
import { useAccountEmail } from "@/lib/engine/account-email";
import { openLogoutDialog } from "@/lib/engine/logout-flow";
import { SYNC_STATUS_KEY, snapshotValue } from "@/lib/engine/store-cache";
import type { AccountStatus } from "@/lib/engine/use-account-status";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import { AccountCard } from "./AccountCard";
import { hasOldPendingChanges } from "./old-pending";
import { OldPendingNotice } from "./OldPendingNotice";
import { SyncFailures, SyncStatusLine } from "./SyncStatusLine";
import { openWriteBlockedDialog } from "@/lib/engine/write-blocked-dialog";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

const Notice = ({ children }: { children: ReactNode }) => (
  <p className={cn("text-xs", cnWarningText)}>{children}</p>
);

/** Sidebar card for a logged-in account: who, sync state, logout, notices. */
export const ActiveAccount = ({
  status,
  tools,
}: {
  status: Extract<AccountStatus, { kind: "active" }>;
  tools: ReactNode;
}) => {
  const email = useAccountEmail();
  const syncSnapshot = useEngineQuery(SYNC_STATUS_KEY, (api) =>
    api.sync.watchStatus()
  );
  const sync = snapshotValue(syncSnapshot);
  const name = email ?? status.userId;

  return (
    <AccountCard
      name={name}
      initial={name.charAt(0).toUpperCase() || null}
      status={<SyncStatusLine sync={sync} />}
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
    >
      <SyncFailures />
      {hasOldPendingChanges(sync) && <OldPendingNotice className="text-xs" />}
      {!status.writeAccess.allowed && (
        <Notice>
          {copyForWriteBlocker(status.writeAccess.reason)}
          {status.writeAccess.reason === "premium_lapsed" && (
            <>
              {" "}
              {/* The modal lives outside the drawer, so close the drawer first. */}
              <DrawerPrimitive.Close asChild>
                <button
                  type="button"
                  className="underline rounded-sm underline-offset-4 decoration-2 hover-text-theme-color-with-opacity-100"
                  onClick={openWriteBlockedDialog}
                >
                  Learn more
                </button>
              </DrawerPrimitive.Close>
            </>
          )}
        </Notice>
      )}
      {sync?.pushBlocked && <Notice>{PUSH_BLOCKED_COPY}</Notice>}
      {status.reviewSettings.status === "update_required" && (
        <Notice>{REVIEW_SETTINGS_UPDATE_COPY}</Notice>
      )}
    </AccountCard>
  );
};
