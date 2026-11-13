import { useState } from "react";
import { DialogActions } from "@/components/common/DialogActions";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { EndSession } from "./EndSessionButton";

/** 0-based place of the current item, and how many the round has. */
export type GamePosition = { index: number; total: number };

const NOT_SAVED_LINE = "Your session will not be saved.";

/**
 * "Are you sure you want to leave?" before leaving a game mid-round. The
 * not-saved line only shows when finishing would have saved the round (a
 * logged-in player on a round that is recorded).
 */
const LeaveDialog = ({
  open,
  warnNotSaved,
  onCancel,
  onLeave,
}: {
  open: boolean;
  warnNotSaved: boolean;
  onCancel: () => void;
  onLeave: () => void;
}) => (
  <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
    <ScrollableDialogContent
      size="md"
      title="Are you sure you want to leave?"
      description={warnNotSaved ? NOT_SAVED_LINE : undefined}
      titleClassName="text-left"
    >
      <div className="flex flex-col gap-5 px-2 pt-2 text-left">
        {warnNotSaved && <p className="text-sm">{NOT_SAVED_LINE}</p>}
        <DialogActions>
          <PracticeButton variant="ghost" onClick={onCancel}>
            Cancel
          </PracticeButton>
          <PracticeButton variant="danger" onClick={onLeave}>
            Leave
          </PracticeButton>
        </DialogActions>
      </div>
    </ScrollableDialogContent>
  </Dialog>
);

/**
 * The top row of every game while a round is in progress: the back button on
 * the left (it, and Escape, ask before leaving) and "3 / 25" on the right.
 * `recorded`: finishing this round saves it to the account, so a logged-in
 * player is told leaving won't. `escapeEnabled`: false while something else
 * on screen owns Escape (an answer drawer).
 */
export const GameHeader = ({
  position,
  recorded,
  escapeEnabled = true,
  onLeave,
}: {
  position: GamePosition;
  recorded: boolean;
  escapeEnabled?: boolean;
  onLeave: () => void;
}) => {
  const [confirming, setConfirming] = useState(false);
  const account = useAccountStatus();

  return (
    <>
      <EndSession
        onClick={() => setConfirming(true)}
        escapeEnabled={escapeEnabled && !confirming}
      />
      <p className="absolute z-10 flex items-center h-10 text-xs font-bold top-1 right-3 tabular-nums">
        {Math.min(position.index + 1, position.total)}
        <span className="ml-1 font-medium text-muted-foreground">
          / {position.total}
        </span>
      </p>
      <LeaveDialog
        open={confirming}
        warnNotSaved={recorded && account.kind === "active"}
        onCancel={() => setConfirming(false)}
        onLeave={onLeave}
      />
    </>
  );
};
