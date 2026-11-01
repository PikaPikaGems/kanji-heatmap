import { UserNotice } from "@/components/common/UserNotice";
import { GAME_NOT_SAVED_UNTIL_SYNC_COPY } from "@/lib/engine/engine-copy";
import { LoginNotice } from "./LoginNotice";
import { SyncNowAction } from "./SyncNowAction";
import { BrowserCantSaveNotice } from "./ProgressNotSavedNotice";
import { cn } from "@/lib/utils";
import {
  getWriteBlocker,
  isSyncBlocker,
  useAccountStatus,
} from "@/lib/engine/use-account-status";

/**
 * Start-screen notice under a game's Start button: the logged-out notice
 * while signed out, "can't be saved in this browser" when the browser can't
 * run the engine, "won't be saved until this device syncs" (with Sync now)
 * while saving is paused, and nothing otherwise (including builds without
 * accounts).
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
  if (account.kind === "active" && isSyncBlocker(getWriteBlocker(account))) {
    return (
      <UserNotice className={cn("text-center", className)}>
        {GAME_NOT_SAVED_UNTIL_SYNC_COPY} <SyncNowAction />
      </UserNotice>
    );
  }
  if (account.kind === "unavailable" && account.reason !== "not-included") {
    return <BrowserCantSaveNotice className={cn("text-center", className)} />;
  }
  return null;
};
