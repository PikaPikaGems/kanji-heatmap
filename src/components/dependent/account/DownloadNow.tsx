import { Loader2 } from "lucide-react";
import { NoticeCard, NoticeCardButton } from "@/components/common/NoticeCard";
import { NoticeAction } from "@/components/common/UserNotice";
import { useDataDownload } from "@/lib/engine/data-download";
import { downloadNow } from "@/lib/engine/data-download-dialog";

/**
 * A notice card's "Download now" for data that hasn't downloaded: opens the
 * download dialog. Busy while a download runs.
 */
export const DownloadNowButton = () => {
  const downloading = useDataDownload() === "downloading";
  return (
    <NoticeCardButton disabled={downloading} onClick={() => void downloadNow()}>
      {downloading && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {downloading ? "Downloading…" : "Download now"}
    </NoticeCardButton>
  );
};

/** The same, as an underlined text button inside a sentence. */
export const DownloadNowAction = ({ className }: { className?: string }) => {
  const downloading = useDataDownload() === "downloading";
  return (
    <NoticeAction
      disabled={downloading}
      additionalClassName={className}
      onClick={() => void downloadNow()}
    >
      {downloading ? "Downloading…" : "Download now"}
    </NoticeAction>
  );
};

/**
 * A quiet card for a drawer section whose data hasn't downloaded, e.g. "📥
 * Your notes haven't downloaded yet. It's safe in your account. Download now".
 */
export const NotDownloadedCard = ({ title }: { title: string }) => (
  <NoticeCard icon="📥" title={title} className="mx-1 my-2">
    It&apos;s safe in your account.{" "}
    <DownloadNowAction className="text-foreground" />
  </NoticeCard>
);
