import { User } from "lucide-react";
import {
  copyForWriteBlocker,
  PUSH_BLOCKED_COPY,
  REVIEW_SETTINGS_UPDATE_COPY,
} from "@/lib/engine/engine-copy";
import { useAccountEmail } from "@/lib/engine/account-email";
import { SYNC_STATUS_KEY, snapshotValue } from "@/lib/engine/store-cache";
import type { AccountStatus } from "@/lib/engine/use-account-status";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import { FsrsSettingsItem } from "./FsrsSettingsItem";
import { LogoutPopover } from "./LogoutPopover";
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
        <LogoutPopover pendingCount={sync?.pendingOperationsCount ?? 0} />
      </div>
      <SyncChip sync={sync} />
      <FsrsSettingsItem />
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
