import { Loader2 } from "lucide-react";
import { DialogActions } from "@/components/common/DialogActions";
import { PracticeButton } from "@/components/ui/practice-button";
import { closeLoginDialog } from "@/lib/engine/login-dialog";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

/** Shown while `sync.catchUp()` runs after a successful login. */
export const LoginDownloadingStep = ({
  error,
  onRetry,
}: {
  /** Set when the download failed; the account is logged in regardless. */
  error: string | null;
  onRetry: () => void;
}) => {
  if (error !== null) {
    return (
      <div className="flex flex-col gap-5 py-2 animate-fade-in-fast">
        <p role="alert" className={cn("text-sm", cnWarningText)}>
          ⚠️ {error}
        </p>
        <DialogActions>
          <PracticeButton variant="secondary" onClick={closeLoginDialog}>
            Continue anyway
          </PracticeButton>
          <PracticeButton onClick={onRetry}>Try again</PracticeButton>
        </DialogActions>
      </div>
    );
  }

  return (
    <p
      role="status"
      className="flex items-center justify-center gap-2 py-8 text-sm font-semibold"
    >
      <Loader2 aria-hidden className="size-5 animate-spin" />
      Downloading your data…
    </p>
  );
};
