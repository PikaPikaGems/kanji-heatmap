import { useState } from "react";
import { Loader2 } from "lucide-react";
import { DialogActions } from "@/components/common/DialogActions";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import {
  finishLoginDownload,
  retryDataDownload,
} from "@/lib/engine/data-download";
import {
  closeDownloadFailedDialog,
  useDownloadFailedDialog,
} from "@/lib/engine/download-failed-dialog";
import { copyForCode } from "@/lib/engine/engine-copy";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import { useResetApp } from "@/providers/app-reset-hooks";
import { LetUsKnowLine } from "./LetUsKnow";

type RetryStatus =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "error"; message: string };

const DownloadFailedBody = () => {
  const [status, setStatus] = useState<RetryStatus>({ kind: "idle" });
  const resetApp = useResetApp();
  const busy = status.kind === "busy";

  const retry = async () => {
    setStatus({ kind: "busy" });
    const code = await retryDataDownload();
    if (code === null) {
      closeDownloadFailedDialog();
      void finishLoginDownload(resetApp);
      return;
    }
    setStatus({ kind: "error", message: copyForCode(code) });
  };

  return (
    <div className="flex flex-col gap-4 px-2 pt-2 text-left">
      <p className="text-sm text-pretty">
        You&apos;re logged in, but your study data couldn&apos;t download to
        this device. It&apos;s safe in your account.
      </p>
      <LetUsKnowLine modal />
      {status.kind === "error" && (
        <p
          role="alert"
          className={cn("text-sm animate-fade-in-fast", cnWarningText)}
        >
          ⚠️ {status.message}
        </p>
      )}
      <DialogActions>
        <PracticeButton
          variant="secondary"
          disabled={busy}
          onClick={closeDownloadFailedDialog}
        >
          Later
        </PracticeButton>
        <PracticeButton disabled={busy} onClick={() => void retry()}>
          {busy && <Loader2 aria-hidden className="size-5 animate-spin" />}
          {busy ? "Downloading…" : "Try again"}
        </PracticeButton>
      </DialogActions>
    </div>
  );
};

/**
 * "Couldn't download your data", opened when the download right after
 * logging in fails (the login dialog closes first). The account stays logged
 * in either way; Later leaves it to the bottom banner's Try again.
 */
export const DownloadFailedDialog = () => {
  const { open, session } = useDownloadFailedDialog();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeDownloadFailedDialog();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title="Couldn't download your data"
        description="You're logged in, but your study data couldn't download to this device"
        titleClassName="text-left"
        onInteractOutside={(event) => event.preventDefault()}
        // Otherwise "let us know", the first button, opens with a focus ring.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {/* A new key per opening, so a past error doesn't show again. */}
        <DownloadFailedBody key={session} />
      </ScrollableDialogContent>
    </Dialog>
  );
};
