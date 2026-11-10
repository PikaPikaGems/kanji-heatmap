import type { ReactNode } from "react";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { DownloadNowAction } from "@/components/dependent/account/DownloadNow";
import { useSyncAttention } from "@/components/dependent/account/old-pending";
import { useLocation } from "@/components/dependent/routing/router-hooks";
import { docPages } from "@/components/items/nav-items";
import { useNetworkState } from "@/hooks/use-network-state";
import { useDataDownload } from "@/lib/engine/data-download";
import {
  dashboardPageMeta,
  exploreKanjiPageMeta,
  masteryPageMeta,
} from "@/lib/pages/nav-links";
import {
  ACCOUNT_CANT_SAVE_BANNER_COPY,
  DATA_NOT_DOWNLOADED_BANNER_COPY,
  GO_ONLINE_BANNER_COPY,
  SAVING_PAUSED_BANNER_COPY,
  SYNC_SOON_BANNER_COPY,
} from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { openSyncNowDialog } from "@/lib/engine/sync-now-dialog";
import {
  getWriteBlocker,
  useAccountStatus,
} from "@/lib/engine/use-account-status";
import { openWriteBlockedDialog } from "@/lib/engine/write-blocked-dialog";
import { BottomBannerLayout } from "./BottomBannerLayout";

/** Reading pages: no banner at all. */
const NO_BANNER_PATHS: string[] = [
  docPages.about.href,
  docPages.credit.href,
  docPages.terms.href,
  docPages.privacy.href,
];
/** The only pages that say "You're not logged in." */
const LOGGED_OUT_BANNER_PATHS: string[] = [
  exploreKanjiPageMeta.href,
  dashboardPageMeta.href,
  masteryPageMeta.href,
];

/** The bar is inverted (light text on dark), and smaller on phones. */
const NoticeBanner = ({
  icon = "⚠️",
  children,
}: {
  icon?: string | null;
  children: ReactNode;
}) => (
  <BottomBannerLayout
    wide={
      <UserNotice
        icon={icon}
        className="text-sm font-extrabold text-center text-background"
      >
        {children}
      </UserNotice>
    }
    narrow={
      <UserNotice
        icon={icon}
        className="text-xs font-extrabold text-center text-background"
      >
        {children}
      </UserNotice>
    }
  />
);

const OfflineBanner = () => (
  <BottomBannerLayout
    wide={
      <>
        ⚠️ {`You're offline.`} Some parts may not work, but you can still use
        the site 💖
      </>
    }
    narrow={
      <>
        <span className="hidden min-[360px]:inline">
          ⚠️ {`You're offline.`} Some parts may not work.
        </span>
        <span className="min-[360px]:hidden">😭 {`You're offline!`}</span>
      </>
    }
  />
);

/**
 * Fixed bottom banner, one message at a time, the first that applies (the
 * same order as `getWriteBlocker`, so every screen names the same problem):
 * 1. the account's data hasn't downloaded (Download now, or go online),
 * 2. the account can't save (no premium; Learn more). Before saving paused:
 *    syncing can't unpause it while the server refuses the uploads,
 * 3. saving is paused until this device syncs (Learn more, or go online),
 * 4. offline,
 * 5. changes have waited over a week to upload (Learn more),
 * 6. logged out, on the home page, dashboard and mastery page only.
 * Never on the about, credit, terms and privacy pages.
 */
const BottomBanner = () => {
  const [location] = useLocation();
  const { online } = useNetworkState();
  const account = useAccountStatus();
  const download = useDataDownload();
  const attention = useSyncAttention();

  if (NO_BANNER_PATHS.includes(location)) return null;

  if (download !== "ready") {
    return (
      <NoticeBanner>
        {DATA_NOT_DOWNLOADED_BANNER_COPY}{" "}
        {online ? <DownloadNowAction /> : GO_ONLINE_BANNER_COPY}
      </NoticeBanner>
    );
  }
  if (getWriteBlocker(account) === "entitlement_expired") {
    return (
      <NoticeBanner>
        {ACCOUNT_CANT_SAVE_BANNER_COPY}{" "}
        <NoticeAction onClick={openWriteBlockedDialog}>Learn more</NoticeAction>
      </NoticeBanner>
    );
  }
  if (attention === "paused-stale" || attention === "paused-full") {
    return (
      <NoticeBanner>
        {SAVING_PAUSED_BANNER_COPY}{" "}
        {online ? (
          <NoticeAction onClick={openSyncNowDialog}>Learn more</NoticeAction>
        ) : (
          GO_ONLINE_BANNER_COPY
        )}
      </NoticeBanner>
    );
  }
  if (!online) return <OfflineBanner />;
  if (attention === "soon") {
    return (
      <NoticeBanner>
        {SYNC_SOON_BANNER_COPY}{" "}
        <NoticeAction onClick={openSyncNowDialog}>Learn more</NoticeAction>
      </NoticeBanner>
    );
  }
  if (
    account.kind === "signed-out" &&
    LOGGED_OUT_BANNER_PATHS.includes(location)
  ) {
    return (
      <NoticeBanner icon={null}>
        You&apos;re not logged in.{" "}
        <NoticeAction onClick={openLoginDialog}>Log in</NoticeAction>
      </NoticeBanner>
    );
  }
  return null;
};

export default BottomBanner;
