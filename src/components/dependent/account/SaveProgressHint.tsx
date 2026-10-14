import { cn } from "@/lib/utils";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { ProgressNotSavedNotice } from "./ProgressNotSavedNotice";

/**
 * Start-screen line under a game's Start button: a log in link when logged
 * out, the "can't be saved in this browser" notice when the browser can't run
 * the engine, and nothing otherwise.
 */
export const SaveProgressHint = ({ className }: { className?: string }) => {
  const account = useAccountStatus();

  if (account.kind !== "signed-out") {
    return <ProgressNotSavedNotice className={className} />;
  }
  return (
    <div className={cn("text-center", className)}>
      <button
        type="button"
        onClick={openLoginDialog}
        className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
      >
        Log in so your progress is saved
      </button>
    </div>
  );
};
