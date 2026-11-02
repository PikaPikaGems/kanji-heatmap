import type { ReactNode } from "react";
import { CheckCircle2, CloudDownload, Loader2 } from "lucide-react";
import { DialogActions } from "@/components/common/DialogActions";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useNetworkState } from "@/hooks/use-network-state";
import {
  closeDataDownloadDialog,
  type DataDownloadStatus,
  downloadNow,
  useDataDownloadDialog,
} from "@/lib/engine/data-download-dialog";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import { useResetApp } from "@/providers/app-reset-hooks";
import { LetUsKnowLine } from "./LetUsKnow";

const TITLES: Record<DataDownloadStatus["kind"], string> = {
  downloading: "Downloading your data…",
  failed: "Couldn't download your data",
  downloaded: "Your data is downloaded",
};

/** A big icon over a line of text, centered. */
const StatusBody = ({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-3 py-4 text-sm text-center text-pretty animate-fade-in-fast">
    {icon}
    {children}
  </div>
);

/** While it downloads: a spinner, and a way to carry on meanwhile. */
const Downloading = () => (
  <>
    <StatusBody
      icon={
        <span className="relative flex items-center justify-center size-14">
          <CloudDownload aria-hidden className="size-7 text-muted-foreground" />
          <Loader2
            aria-hidden
            className="absolute inset-0 size-14 animate-spin text-muted-foreground/40"
          />
        </span>
      }
    >
      <p role="status">Downloading your study data to this device.</p>
    </StatusBody>
    <DialogActions>
      <PracticeButton variant="secondary" onClick={closeDataDownloadDialog}>
        Keep browsing
      </PracticeButton>
    </DialogActions>
  </>
);

/** It failed: why, who to tell, then try again or later. */
const Failed = ({
  message,
  afterLogin,
}: {
  message: string | null;
  afterLogin: boolean;
}) => {
  const { online } = useNetworkState();
  const resetApp = useResetApp();
  const reason = online
    ? message
    : "You're offline. Go online, then try again.";

  return (
    <div className="flex flex-col gap-4 px-2 pt-2 text-left animate-fade-in-fast">
      <p className="text-sm text-pretty">
        {afterLogin ? "You're logged in, but your" : "Your"} study data
        couldn&apos;t download to this device. It&apos;s safe in your account.
      </p>
      {reason && (
        <p role="alert" className={cn("text-sm", cnWarningText)}>
          ⚠️ {reason}
        </p>
      )}
      <LetUsKnowLine modal />
      <DialogActions>
        <PracticeButton variant="secondary" onClick={closeDataDownloadDialog}>
          Later
        </PracticeButton>
        <PracticeButton
          disabled={!online}
          onClick={() => void downloadNow(resetApp)}
        >
          Try again
        </PracticeButton>
      </DialogActions>
    </div>
  );
};

/** It worked; the screens behind have already filled in. */
const Downloaded = () => (
  <>
    <StatusBody
      icon={<CheckCircle2 aria-hidden className="text-green-500 size-14" />}
    >
      <p role="status">Your data is on this device.</p>
    </StatusBody>
    <PracticeButton size="md" onClick={closeDataDownloadDialog}>
      Done
    </PracticeButton>
  </>
);

/**
 * Downloading the account's data: downloading, then whether it worked (see
 * `data-download-dialog.ts`). The account stays logged in either way; Later
 * leaves it to the next automatic retry or "Download now".
 */
export const DataDownloadDialog = () => {
  const { open, session, status, afterLogin } = useDataDownloadDialog();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeDataDownloadDialog();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title={TITLES[status.kind]}
        description="Downloading your study data to this device"
        titleClassName="text-left"
        onInteractOutside={(event) => event.preventDefault()}
        // Otherwise "let us know", the first button, opens with a focus ring.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {/* Keyed so each step fades in, and a past error doesn't show again. */}
        <div
          key={`${session}-${status.kind}`}
          className="flex flex-col gap-4 pb-2"
        >
          {status.kind === "downloading" && <Downloading />}
          {status.kind === "failed" && (
            <Failed message={status.message} afterLogin={afterLogin} />
          )}
          {status.kind === "downloaded" && <Downloaded />}
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};
