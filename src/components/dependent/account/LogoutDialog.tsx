import { useState, type ReactNode } from "react";
import { DialogActions } from "@/components/common/DialogActions";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useRecentFailedOperations } from "@/components/dependent/sync-operations/use-recent-failed-operations";
import { useAiStorageUsage } from "@/hooks/use-ai-storage-usage";
import { useHasSavedAiKey } from "@/hooks/use-has-saved-ai-key";
import { useNetworkState } from "@/hooks/use-network-state";
import { useAccountEmail } from "@/lib/engine/account-email";
import {
  closeLogoutDialog,
  startLogout,
  useLogoutFlow,
} from "@/lib/engine/logout-flow";
import { openSyncOperations } from "@/lib/engine/sync-operations-dialog";
import { useSyncStatus } from "@/lib/engine/sync-queries";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { formatMegabytes } from "@/lib/format-bytes";
import { LogoutRemovalOption } from "./LogoutRemovalOption";
import { SyncNowButton } from "./SyncNowButton";

type RemovalChoices = {
  studyData: boolean;
  aiContent: boolean;
  aiKey: boolean;
};

/** Bold yellow "lost for good" lines under a ticked checkbox. */
const RemovalWarning = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col items-start gap-1.5 text-sm font-bold text-yellow-600 pl-7 text-pretty dark:text-yellow-400 animate-fade-in-fast">
    {children}
  </div>
);

const LogoutForm = ({ userId }: { userId: string }) => {
  const name = useAccountEmail() ?? userId;
  const { online } = useNetworkState();
  const pending = useSyncStatus()?.pendingOperationsCount ?? 0;
  const failed = useRecentFailedOperations().result;
  const aiUsage = useAiStorageUsage();
  const hasAiKey = useHasSavedAiKey(userId);
  // The key is deleted by default: leaving it behind should be a choice.
  const [choices, setChoices] = useState<RemovalChoices>({
    studyData: false,
    aiContent: false,
    aiKey: true,
  });
  const choose = (key: keyof RemovalChoices) => (checked: boolean) =>
    setChoices({ ...choices, [key]: checked });

  const aiBytes =
    aiUsage.status === "ready"
      ? Object.values(aiUsage.usage).reduce((sum, kind) => sum + kind.mine, 0)
      : 0;
  const deleteAiContent = aiBytes > 0 && choices.aiContent;
  const deleteAiKey = hasAiKey && choices.aiKey;
  const losesUnsynced = choices.studyData && pending > 0;
  const losesRejectedNotes =
    choices.studyData &&
    failed.kind === "ready" &&
    failed.operations.some(
      (op) =>
        op.operationType === "note-save" && op.state === "permanently-rejected"
    );
  const changeWord = pending === 1 ? "change" : "changes";
  const deletes = choices.studyData || deleteAiContent;

  return (
    <div className="flex flex-col gap-5 px-2 pt-1 text-left">
      {/* The dialog's own description is for screen readers only. */}
      <p aria-hidden className="text-sm break-words text-muted-foreground">
        You&apos;re logged in as{" "}
        <span className="font-semibold text-foreground">{name}</span>
      </p>
      {!online && (
        <UserNotice>
          <strong>You&apos;re offline.</strong> You can still log out on this
          device.
          {pending > 0 &&
            " Changes that haven't synced can't sync until you're back online."}
        </UserNotice>
      )}
      {pending > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
            ⚠️ {pending} {changeWord} {pending === 1 ? "hasn't" : "haven't"}{" "}
            synced yet
          </h3>
          <p className="text-sm text-pretty">
            They sync automatically while you&apos;re logged in and online. If
            you log out now, they stay on this device but could be deleted
            before they sync.{" "}
            <NoticeAction onClick={() => openSyncOperations("pending")}>
              View unsynced changes
            </NoticeAction>
          </p>
          {online && <SyncNowButton className="mt-1" />}
        </section>
      )}
      <div className="pt-4 border-t-2 border-dashed">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-bold">
            Also remove from this device
          </legend>
          <LogoutRemovalOption
            label="My study data"
            details="Notes, bookmarks, review pile and progress. They're saved to your account and come back when you log in again."
            checked={choices.studyData}
            onCheckedChange={choose("studyData")}
          />
          {(losesUnsynced || losesRejectedNotes) && (
            <RemovalWarning>
              {losesUnsynced && (
                <p>
                  ⚠️ Your {pending} unsynced {changeWord} will be lost forever
                  if you log out.{" "}
                  <NoticeAction onClick={() => openSyncOperations("pending")}>
                    View unsynced changes
                  </NoticeAction>
                </p>
              )}
              {losesRejectedNotes && (
                <p>
                  ⚠️ Some rejected notes may have no server copy. They&apos;ll
                  be lost for good.{" "}
                  <NoticeAction onClick={() => openSyncOperations("attention")}>
                    Review rejected notes
                  </NoticeAction>
                </p>
              )}
            </RemovalWarning>
          )}
          {aiBytes > 0 && (
            <LogoutRemovalOption
              label={`My AI-generated content (${formatMegabytes(aiBytes)})`}
              details="AI text, images and MP3s. These are saved only in this browser and can't be recovered. Download anything you want to keep first."
              checked={choices.aiContent}
              onCheckedChange={choose("aiContent")}
            />
          )}
          {deleteAiContent && (
            <RemovalWarning>
              <p>⚠️ This can&apos;t be undone.</p>
            </RemovalWarning>
          )}
          {hasAiKey && (
            <LogoutRemovalOption
              label="My saved xAI API key"
              details="You'll need to paste it again next time."
              checked={choices.aiKey}
              onCheckedChange={choose("aiKey")}
            />
          )}
        </fieldset>
      </div>
      <DialogActions className="pt-1">
        <PracticeButton variant="secondary" onClick={closeLogoutDialog}>
          Cancel
        </PracticeButton>
        <PracticeButton
          variant={deletes ? "danger" : "primary"}
          onClick={() =>
            startLogout({
              clearLocalData: choices.studyData,
              ai: {
                userId,
                deleteContent: deleteAiContent,
                deleteKey: deleteAiKey,
              },
            })
          }
        >
          {deletes ? "Log out and delete" : "Log out"}
        </PracticeButton>
      </DialogActions>
    </div>
  );
};

/**
 * The one app-wide "Log out?" modal (design 5.3.1), mounted once in App and
 * opened with `openLogoutDialog()`. Choosing "Log out" hands over to the
 * full-screen logging-out screen.
 */
export const LogoutDialog = () => {
  const flow = useLogoutFlow();
  const account = useAccountStatus();
  // Only for the account it was opened for, so a stale one never reappears.
  const open =
    flow.phase === "confirm" &&
    account.kind === "active" &&
    account.userId === flow.userId;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeLogoutDialog();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title="Log out?"
        description="Choose what to remove from this device before logging out"
        titleClassName="text-left"
      >
        {account.kind === "active" && <LogoutForm userId={account.userId} />}
      </ScrollableDialogContent>
    </Dialog>
  );
};
