import { NoticeAction } from "@/components/common/UserNotice";
import { syncNow } from "@/lib/engine/sync-now-dialog";
import { useEngineApi } from "@/lib/engine/use-engine-query";

/**
 * The inline "Sync now" after a saving-paused message: opens the Sync now
 * dialog, which syncs and says how it went.
 */
export const SyncNowAction = () => {
  const api = useEngineApi();
  return (
    <NoticeAction
      disabled={!api}
      onClick={() => {
        if (api) void syncNow(api);
      }}
    >
      Sync now
    </NoticeAction>
  );
};
