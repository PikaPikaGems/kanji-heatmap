import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import {
  SAVING_PAUSED_BANNER_COPY,
  SYNC_SOON_BANNER_COPY,
} from "@/lib/engine/engine-copy";
import { openSyncNowDialog } from "@/lib/engine/sync-now-dialog";
import type { SyncAttention } from "./old-pending";

/**
 * The bottom banner's "⚠️ Please sync soon. **Learn more**" (or "Saving is
 * paused."). Short enough for one line on phones: "Learn more" opens the
 * Sync now dialog, which explains why and has the Sync now button.
 */
export const SyncNeededNotice = ({
  attention,
  className,
}: {
  attention: Exclude<SyncAttention, "none">;
  className?: string;
}) => (
  <UserNotice className={className}>
    {attention === "soon" ? SYNC_SOON_BANNER_COPY : SAVING_PAUSED_BANNER_COPY}{" "}
    <NoticeAction onClick={openSyncNowDialog}>Learn more</NoticeAction>
  </UserNotice>
);
