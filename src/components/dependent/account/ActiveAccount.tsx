import { LogOut, User } from "lucide-react";
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
import { FsrsSettingsItem } from "./FsrsSettingsItem";
import { SyncChip } from "./SyncChip";

const Notice = ({ children }: { children: string }) => (
  <p className="text-xs text-amber-600 dark:text-amber-400">{children}</p>
);

/** Sidebar row for a logged-in account: who, sync state, logout, notices. */
export const ActiveAccount = ({
  status,
}: {
  status: Extract<AccountStatus, { kind: "active" }>;
}) => {
  const email = useAccountEmail();
  const syncSnapshot = useEngineQuery(SYNC_STATUS_KEY, (api) =>
    api.sync.watchStatus()
  );
  const sync = snapshotValue(syncSnapshot);
  const name = email ?? status.userId;

  return (
    <div className="flex flex-col gap-2 p-2 text-left border rounded-xl">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center min-w-0 gap-1.5 text-sm font-semibold">
          <User className="size-4 shrink-0" aria-hidden />
          <span className="truncate" title={name}>
            {name}
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          <FsrsSettingsItem />
          {/* The modal lives outside the drawer, so close the drawer first. */}
          <DrawerPrimitive.Close asChild>
            <Button
              variant="outline"
              size="iconXl"
              aria-label="Log out"
              onClick={() => openLogoutDialog(status.userId)}
            >
              <LogOut className="w-[1.2rem] h-[1.2rem]" />
            </Button>
          </DrawerPrimitive.Close>
        </div>
      </div>
      <SyncChip sync={sync} />
      {!status.writeAccess.allowed && (
        <Notice>{copyForWriteBlocker(status.writeAccess.reason)}</Notice>
      )}
      {sync?.pushBlocked && <Notice>{PUSH_BLOCKED_COPY}</Notice>}
      {status.reviewSettings.status === "update_required" && (
        <Notice>{REVIEW_SETTINGS_UPDATE_COPY}</Notice>
      )}
    </div>
  );
};
