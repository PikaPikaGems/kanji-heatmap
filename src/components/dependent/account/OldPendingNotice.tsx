import { useState } from "react";
import { Loader2 } from "lucide-react";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import {
  copyForCode,
  OLD_PENDING_WARNING_COPY,
  OLD_PENDING_WARNING_SHORT_COPY,
} from "@/lib/engine/engine-copy";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import type { ActionStatus } from "./action-status";

/**
 * "⚠️ Some changes haven't synced in a week. Go online and **sync now**, or
 * saving will pause." "sync now" runs `sync.catchUp()`; while it runs the
 * line reads "Syncing…", and a failure shows under the sentence. The caller
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
  const [status, setStatus] = useState<ActionStatus>({ kind: "idle" });

  const syncNow = async () => {
    if (!api || status.kind === "busy") return;
    setStatus({ kind: "busy" });
    const result = await api.sync.catchUp();
    setStatus(
      result.ok
        ? { kind: "idle" }
        : { kind: "error", message: copyForCode(result.error.code) }
    );
  };

  if (status.kind === "busy") {
    return (
      <UserNotice icon={null} className={className}>
        <span role="status">
          <Loader2
            aria-hidden
            className="inline mr-1.5 -mt-0.5 size-4 animate-spin"
          />
          Syncing…
        </span>
      </UserNotice>
    );
  }

  const copy = short
    ? OLD_PENDING_WARNING_SHORT_COPY
    : OLD_PENDING_WARNING_COPY;
  return (
    <UserNotice className={className}>
      {copy.before}
      <NoticeAction disabled={!api} onClick={() => void syncNow()}>
        {copy.action}
      </NoticeAction>
      {copy.after}
      {status.kind === "error" && (
        <span role="alert" className="block font-bold">
          {status.message}
        </span>
      )}
    </UserNotice>
  );
};
