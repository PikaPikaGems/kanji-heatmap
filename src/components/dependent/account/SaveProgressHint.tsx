import { LoginNotice } from "./LoginNotice";
import { BrowserCantSaveNotice, NotSavedLine } from "./ProgressNotSavedNotice";
import { cn } from "@/lib/utils";
import { useDataDownload } from "@/lib/engine/data-download";
import {
  getWriteBlocker,
  useAccountStatus,
} from "@/lib/engine/use-account-status";

/**
 * Start-screen notice under a game's Start button: the logged-out notice
 * while signed out, "can't be saved in this browser" when the browser can't
 * run the engine, and "You can play, but your rounds won't be saved: …" when
 * the account can't save right now (the bottom banner says what's wrong,
 * not that rounds won't save). Nothing while the data is still downloading:
 * a round that ends after it lands is saved.
 */
export const SaveProgressHint = ({ className }: { className?: string }) => {
  const account = useAccountStatus();
  const download = useDataDownload();

  if (account.kind === "signed-out") {
    return (
      <LoginNotice
        to="save your progress"
        className={cn("text-center", className)}
      />
    );
  }
  if (account.kind === "unavailable" && account.reason !== "not-included") {
    return <BrowserCantSaveNotice className={cn("text-center", className)} />;
  }
  if (download === "downloading") return null;
  const blocker = getWriteBlocker(account, download);
  if (
    blocker === null ||
    blocker === "loading" ||
    blocker === "unavailable" ||
    blocker === "cache_rebuilding"
  ) {
    return null;
  }
  return (
    <NotSavedLine
      before="You can play, but your rounds won't be saved:"
      blocker={blocker}
      className={className}
    />
  );
};
