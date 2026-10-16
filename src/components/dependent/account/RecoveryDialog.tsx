import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">
          Unsynced changes on this device will be lost.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" onClick={() => logOut(true)}>
            Delete and resync
          </Button>
          <Button variant="outline" onClick={() => setStep({ kind: "choose" })}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        The data saved on this device for your account couldn&apos;t be opened.
        Keep it and retry later, or delete it and download your data again.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => logOut(false)}>Keep and retry</Button>
        <Button
          variant="outline"
          onClick={() => setStep({ kind: "confirm-delete" })}
        >
          Delete and resync
        </Button>
      </div>
      {account.kind === "recovery" && (
        <p className="text-[10px] text-muted-foreground">
          Diagnostic id: {account.diagnosticId}
        </p>
      )}
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
        <div className="px-2 pt-2 text-left">
          <RecoveryDialogSteps />
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};
