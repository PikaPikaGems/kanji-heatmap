import type { ActionStatus } from "@/components/dependent/account/action-status";

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
      <span className="font-bold text-yellow-600 dark:text-yellow-400">
        Too long to save. Shorten it to keep your changes.
      </span>
    );
  }
  if (save.kind === "error") {
    return (
      <span className="font-bold text-yellow-600 dark:text-yellow-400">
        {save.message}
      </span>
    );
  }
  if (save.kind === "busy") {
    return <span className="text-muted-foreground">Saving…</span>;
  }
  if (hasUnsavedChanges) {
    return (
      <>
        <span className="text-muted-foreground">Not saved yet</span>
        <button
          type="button"
          onClick={onSaveNow}
          className="font-bold underline underline-offset-2"
        >
          Save now
        </button>
      </>
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
