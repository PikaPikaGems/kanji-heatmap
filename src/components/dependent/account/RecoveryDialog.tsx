import { useState } from "react";
import { DialogActions } from "@/components/common/DialogActions";
import { ErrorTerminal } from "@/components/common/ErrorTerminal";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useEngineState } from "@/lib/engine/engine";
import { startLogout } from "@/lib/engine/logout-flow";
import {
  closeRecoveryDialog,
  useRecoveryDialogOpen,
} from "@/lib/engine/recovery-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";

type RecoveryStep = { kind: "choose" } | { kind: "confirm-delete" };

/** Closes this dialog and hands the logout to the full-screen logging-out screen. */
const logOut = (clearLocalData: boolean) => {
  closeRecoveryDialog();
  startLogout({ clearLocalData });
};

const RecoveryDialogSteps = () => {
  const account = useAccountStatus();
  const [step, setStep] = useState<RecoveryStep>({ kind: "choose" });

  if (step.kind === "confirm-delete") {
    return (
      <div key={step.kind} className="flex flex-col gap-5 animate-fade-in-fast">
        <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
          ⚠️ Unsynced changes on this device will be lost.
        </p>
        <DialogActions>
          <PracticeButton
            variant="ghost"
            onClick={() => setStep({ kind: "choose" })}
          >
            Cancel
          </PracticeButton>
          <PracticeButton variant="danger" onClick={() => logOut(true)}>
            Delete and resync
          </PracticeButton>
        </DialogActions>
      </div>
    );
  }

  return (
    <div key={step.kind} className="flex flex-col gap-5 animate-fade-in-fast">
      <p className="text-sm text-pretty">
        The data saved on this device for your account couldn&apos;t be opened.
        Keep it and retry later, or delete it and download your data again.
      </p>
      {account.kind === "recovery" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-pretty">
            If this keeps happening, copy this and send it to us.
          </p>
          <ErrorTerminal
            filename="recovery.log"
            content={`status: local_cache_recovery_required\ndiagnosticId: ${account.diagnosticId}`}
          />
        </div>
      )}
      <DialogActions>
        <PracticeButton
          variant="secondary"
          onClick={() => setStep({ kind: "confirm-delete" })}
        >
          Delete and resync
        </PracticeButton>
        <PracticeButton onClick={() => logOut(false)}>
          Keep and retry
        </PracticeButton>
      </DialogActions>
    </div>
  );
};

/**
 * Local-cache recovery dialog (design 5.3), mounted once in App. Opened with
 * `openRecoveryDialog()` from the sidebar and from the login dialog.
 */
export const RecoveryDialog = () => {
  const open = useRecoveryDialogOpen();
  const engine = useEngineState();
  if (engine.status !== "ready") return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeRecoveryDialog();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title="Saved data needs attention"
        description="Keep or delete the data saved on this device after it could not be opened"
        titleClassName="text-left"
      >
        <div className="px-2 pt-1 text-left">
          <RecoveryDialogSteps />
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};
