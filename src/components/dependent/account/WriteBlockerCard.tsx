import type { ReactNode } from "react";
import { NoticeCard, NoticeCardButton } from "@/components/common/NoticeCard";
import {
  copyForWriteBlocker,
  ENTITLEMENT_EXPIRED_COPY,
  SAVING_PAUSED_BANNER_COPY,
} from "@/lib/engine/engine-copy";
import { openRecoveryDialog } from "@/lib/engine/recovery-dialog";
import { syncNow } from "@/lib/engine/sync-now-dialog";
import {
  isSyncBlocker,
  type WriteBlocker,
} from "@/lib/engine/use-account-status";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { openWriteBlockedDialog } from "@/lib/engine/write-blocked-dialog";
import { DownloadNowButton } from "./DownloadNow";
import { LetUsKnowLine } from "./LetUsKnow";

/** "Sync now" on a saving-paused card: opens the Sync now dialog. */
const SyncNowCardButton = () => {
  const api = useEngineApi();
  return (
    <NoticeCardButton
      variant="secondary"
      disabled={!api}
      onClick={() => {
        if (api) void syncNow(api);
      }}
    >
      Sync now
    </NoticeCardButton>
  );
};

/**
 * Why the account can't save right now, as a notice card: the reason as its
 * title, its fix as the button, and `children` saying what it means on this
 * screen. FSRS settings and Unsynced changes share it, so they word each
 * reason the same way. Inside a dialog, pass `modal` (the "let us know"
 * pop-up can't be clicked otherwise).
 */
export const WriteBlockerCard = ({
  blocker,
  children,
  modal = false,
}: {
  blocker: WriteBlocker;
  children: ReactNode;
  modal?: boolean;
}) => {
  if (blocker === "not-downloaded" || blocker === "cache_rebuilding") {
    return (
      <NoticeCard
        icon="📥"
        title={copyForWriteBlocker("not-downloaded")}
        action={<DownloadNowButton />}
        footer={<LetUsKnowLine modal={modal} />}
      >
        {children}
      </NoticeCard>
    );
  }
  if (blocker === "entitlement_expired") {
    return (
      <NoticeCard
        icon="⚠️"
        title={ENTITLEMENT_EXPIRED_COPY}
        action={
          <NoticeCardButton
            variant="secondary"
            onClick={openWriteBlockedDialog}
          >
            Learn more
          </NoticeCardButton>
        }
      >
        {children}
      </NoticeCard>
    );
  }
  if (isSyncBlocker(blocker)) {
    return (
      <NoticeCard
        icon="⚠️"
        title={SAVING_PAUSED_BANNER_COPY}
        action={<SyncNowCardButton />}
      >
        {blocker === "outbox_full"
          ? "Too many changes are waiting to upload."
          : "Some changes haven't uploaded for too long."}{" "}
        {children}
      </NoticeCard>
    );
  }
  if (blocker === "recovery") {
    return (
      <NoticeCard
        icon="⚠️"
        title={copyForWriteBlocker(blocker)}
        action={
          <NoticeCardButton variant="secondary" onClick={openRecoveryDialog}>
            Fix it
          </NoticeCardButton>
        }
      >
        {children}
      </NoticeCard>
    );
  }
  // Out of storage, unavailable, still loading.
  return (
    <NoticeCard icon="⚠️" title={copyForWriteBlocker(blocker)}>
      {children}
    </NoticeCard>
  );
};
