import { Loader2 } from "lucide-react";
import { NoticeCard, NoticeCardButton } from "@/components/common/NoticeCard";
import { NoticeAction } from "@/components/common/UserNotice";
import { retryDataDownload, useDataDownload } from "@/lib/engine/data-download";

/** A notice card's "Try again" for data that hasn't downloaded; busy while it downloads. */
export const DownloadAgainButton = () => {
  const downloading = useDataDownload() === "downloading";
  return (
    <NoticeCardButton
      disabled={downloading}
      onClick={() => void retryDataDownload()}
    >
      {downloading && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {downloading ? "Downloading…" : "Try again"}
    </NoticeCardButton>
  );
};

/** The same, as an underlined text button inside a sentence. */
export const DownloadAgainAction = ({ className }: { className?: string }) => {
  const downloading = useDataDownload() === "downloading";
  return (
    <NoticeAction
      disabled={downloading}
      additionalClassName={className}
      onClick={() => void retryDataDownload()}
    >
      {downloading ? "Downloading…" : "Try again"}
    </NoticeAction>
  );
};

/**
 * A quiet card for a drawer section whose data hasn't downloaded, e.g. "📥
 * Your notes haven't downloaded yet. It's safe in your account. Try again".
 */
export const NotDownloadedCard = ({ title }: { title: string }) => (
  <NoticeCard icon="📥" title={title} className="mx-1 my-2">
    It&apos;s safe in your account.{" "}
    <DownloadAgainAction className="text-foreground" />
  </NoticeCard>
);
