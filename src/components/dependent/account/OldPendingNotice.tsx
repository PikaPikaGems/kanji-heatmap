import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import {
  OLD_PENDING_WARNING_COPY,
  OLD_PENDING_WARNING_SHORT_COPY,
} from "@/lib/engine/engine-copy";
import { syncNow } from "@/lib/engine/sync-now-dialog";
import { useEngineApi } from "@/lib/engine/use-engine-query";

/**
 * "⚠️ Some changes haven't synced in a week. Go online and **sync now**, or
 * saving will pause." "sync now" opens the Sync now dialog, which runs
 * `sync.catchUp()` and says how it went (see `SyncNowDialog`). The caller
 * decides when to show it (see `useHasOldPendingChanges`).
 */
export const OldPendingNotice = ({
  short = false,
  className,
}: {
  /** Phones: "Week-old changes haven't synced. **Sync now**". */
  short?: boolean;
  className?: string;
}) => {
  const api = useEngineApi();
  const copy = short
    ? OLD_PENDING_WARNING_SHORT_COPY
    : OLD_PENDING_WARNING_COPY;
  return (
    <UserNotice className={className}>
      {copy.before}
      <NoticeAction
        disabled={!api}
        onClick={() => {
          if (api) void syncNow(api);
        }}
      >
        {copy.action}
      </NoticeAction>
      {copy.after}
    </UserNotice>
  );
};
