import { NoticeAction } from "@/components/common/UserNotice";
import type { ActionStatus } from "@/components/dependent/account/action-status";
import { cnWarningText } from "@/lib/generic-cn";

/** Save progress shown beside the byte counter of the note editor. */
export const NoteSaveStatus = ({
  overLimit,
  save,
  hasUnsavedChanges,
  syncStatus,
  onSaveNow,
}: {
  overLimit: boolean;
  save: ActionStatus;
  hasUnsavedChanges: boolean;
  /** The saved note's `status`; null when it has never been saved. */
  syncStatus: "pending-sync" | "synced" | null;
  onSaveNow: () => void;
}) => {
  if (overLimit) {
    return (
      <span className={cnWarningText}>
        Too long to save. Shorten it to keep your changes.
      </span>
    );
  }
  if (save.kind === "error") {
    return <span className={cnWarningText}>{save.message}</span>;
  }
  if (save.kind === "busy") {
    return <span className="text-muted-foreground">Saving…</span>;
  }
  if (hasUnsavedChanges) {
    return (
      // One element with real spaces, so the parts never run together where
      // the parent has no gap (the "Continue writing" box on touch screens).
      <span>
        <span className="text-muted-foreground">Not saved yet</span>{" "}
        <span className="text-muted-foreground" aria-hidden>
          ·
        </span>{" "}
        <NoticeAction onClick={onSaveNow}>Save now</NoticeAction>
      </span>
    );
  }
  if (syncStatus === "pending-sync") {
    return (
      <span className="text-muted-foreground">
        Saved on this device · syncing
      </span>
    );
  }
  if (syncStatus === "synced") {
    return <span className="text-muted-foreground">Synced</span>;
  }
  return null;
};
