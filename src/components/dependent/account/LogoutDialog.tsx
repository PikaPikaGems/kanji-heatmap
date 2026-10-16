import { useState } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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

const OperationsLink = ({
  tab,
  children,
}: {
  tab: "pending" | "attention";
  children: string;
}) => (
  <button
    type="button"
    className="self-start text-xs font-semibold text-left underline underline-offset-4"
    onClick={() => openSyncOperations(tab)}
  >
    {children}
  </button>
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

  return (
    <div className="flex flex-col gap-4 px-2 pt-2 text-left">
      {/* The dialog's own description is for screen readers only. */}
      <p aria-hidden className="text-sm break-words text-muted-foreground">
        You&apos;re logged in as {name}
      </p>
      {!online && (
        <p className="flex items-start gap-2 p-3 text-xs border rounded-xl bg-muted/50 text-muted-foreground">
          <WifiOff aria-hidden className="mt-px size-4 shrink-0" />
          <span>
            <strong>You&apos;re offline.</strong> You can still log out on this
            device.
            {pending > 0 &&
              " Changes that haven't synced can't sync until you're back online."}
          </span>
        </p>
      )}
      {pending > 0 && (
        <div className="flex flex-col gap-1.5 p-3 border rounded-xl border-amber-500/50 bg-amber-500/10">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            ⚠️ {pending} {changeWord} {pending === 1 ? "hasn't" : "haven't"}{" "}
            synced yet
          </p>
          <p className="text-xs">
            They sync automatically while you&apos;re logged in and online. If
            you log out now, they stay on this device but could be deleted
            before they sync.
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {online && <SyncNowButton />}
            <OperationsLink tab="pending">View unsynced changes</OperationsLink>
          </div>
        </div>
      )}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold">
          Also remove from this device
        </legend>
        <LogoutRemovalOption
          label="My study data"
          details="Notes, bookmarks, review pile and progress. They're saved to your account and come back when you log in again."
          checked={choices.studyData}
          onCheckedChange={choose("studyData")}
        />
        {(losesUnsynced || losesRejectedNotes) && (
          <div className="flex flex-col gap-1 text-xs pl-7 text-rose-600 dark:text-rose-400">
            {losesUnsynced && (
              <p>
                ⚠️ Your {pending} unsynced {changeWord} will be lost for good.
              </p>
            )}
            {losesRejectedNotes && (
              <>
                <p>
                  ⚠️ Some rejected notes may have no server copy. They&apos;ll
                  be lost for good.
                </p>
                <OperationsLink tab="attention">
                  Review rejected notes
                </OperationsLink>
              </>
            )}
          </div>
        )}
        {aiBytes > 0 && (
          <LogoutRemovalOption
            label={`My AI-generated content (${formatMegabytes(aiBytes)})`}
            details="AI text, images and MP3s. These are saved only in this browser and can't be recovered. Download anything you want to keep first."
            checked={choices.aiContent}
            onCheckedChange={choose("aiContent")}
          />
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
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={closeLogoutDialog}>
          Cancel
        </Button>
        <Button
          variant={deleteAiContent || losesUnsynced ? "destructive" : "default"}
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
          {deleteAiContent || losesUnsynced ? "Log out and delete" : "Log out"}
        </Button>
      </div>
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
