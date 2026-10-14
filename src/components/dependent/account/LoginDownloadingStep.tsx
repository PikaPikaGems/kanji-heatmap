import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { closeLoginDialog } from "@/lib/engine/login-dialog";

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
      <div className="flex flex-col gap-3 py-2">
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={onRetry}>
            Try again
          </Button>
          <Button size="sm" variant="outline" onClick={closeLoginDialog}>
            Continue anyway
          </Button>
        </div>
      </div>
    );
  }

  return (
    <p
      role="status"
      className="flex items-center justify-center gap-2 py-6 text-sm"
    >
      <Loader2 className="size-4 animate-spin" />
      Downloading your data…
    </p>
  );
};
