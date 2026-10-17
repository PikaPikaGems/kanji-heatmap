import { LoginNotice } from "./LoginNotice";
import { BrowserCantSaveNotice } from "./ProgressNotSavedNotice";
import { cn } from "@/lib/utils";
import { useAccountStatus } from "@/lib/engine/use-account-status";

/**
 * Start-screen notice under a game's Start button: the logged-out notice
 * while signed out, "can't be saved in this browser" when the browser can't
 * run the engine, and nothing otherwise (including builds without accounts).
 */
export const SaveProgressHint = ({ className }: { className?: string }) => {
  const account = useAccountStatus();

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
  return null;
};
