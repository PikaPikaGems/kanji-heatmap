import { NoticeCard, NoticeCardButton } from "@/components/common/NoticeCard";
import { DownloadNowButton } from "@/components/dependent/account/DownloadNow";
import { LetUsKnowLine } from "@/components/dependent/account/LetUsKnow";
import { useDataDownload } from "@/lib/engine/data-download";
import {
  ENGINE_FAILED_DETAIL_COPY,
  ENGINE_FAILED_TITLE_COPY,
  UPDATE_BROWSER_DETAIL_COPY,
  UPDATE_BROWSER_TITLE_COPY,
} from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { openRecoveryDialog } from "@/lib/engine/recovery-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";

/**
 * Tells why the dashboard below shows an empty account, as a notice card:
 * logged out, data not downloaded yet, a browser that can't save progress,
 * or an account that can't be read right now. Renders nothing while loading,
 * when the account's data is here, or in a build without the engine (there
 * the dashboard is just the empty one, with no account talk).
 */
export const DashboardAccountBanner = () => {
  const account = useAccountStatus();
  const download = useDataDownload();

  if (account.kind === "signed-out") {
    return (
      <NoticeCard
        icon="👀"
        title="You're not logged in."
        action={
          <NoticeCardButton variant="secondary" onClick={openLoginDialog}>
            Log in
          </NoticeCardButton>
        }
      >
        Log in to see your progress.
      </NoticeCard>
    );
  }
  if (account.kind === "active" && download !== "ready") {
    return (
      <NoticeCard
        icon="📥"
        title="Your progress hasn't downloaded yet."
        action={<DownloadNowButton />}
        footer={<LetUsKnowLine />}
      >
        It&apos;s safe in your account. The stats below fill in once it
        downloads.
      </NoticeCard>
    );
  }
  if (account.kind === "unavailable" && account.reason === "not-included") {
    return null;
  }
  if (account.kind === "unavailable" && account.reason === "failed") {
    return (
      <NoticeCard icon="⚠️" title={ENGINE_FAILED_TITLE_COPY}>
        {ENGINE_FAILED_DETAIL_COPY}
      </NoticeCard>
    );
  }
  if (account.kind === "unavailable") {
    return (
      <NoticeCard icon="⚠️" title={UPDATE_BROWSER_TITLE_COPY}>
        {UPDATE_BROWSER_DETAIL_COPY}
      </NoticeCard>
    );
  }
  if (account.kind === "recovery") {
    return (
      <NoticeCard
        icon="⚠️"
        title="This device's saved data needs attention."
        action={
          <NoticeCardButton variant="secondary" onClick={openRecoveryDialog}>
            Fix it
          </NoticeCardButton>
        }
      >
        Fix it to see your progress.
      </NoticeCard>
    );
  }
  if (account.kind === "error") {
    return (
      <NoticeCard icon="⚠️" title="Your progress isn't available right now." />
    );
  }
  return null;
};
