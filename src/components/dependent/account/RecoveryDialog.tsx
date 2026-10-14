import { useState } from "react";
import type { EngineAPI } from "engine-contract";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useEngineState } from "@/lib/engine/engine";
import { copyForCode } from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import {
  closeRecoveryDialog,
  useRecoveryDialogOpen,
} from "@/lib/engine/recovery-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";

type RecoveryAction = "keep" | "delete";

type RecoveryStep =
  | { kind: "choose"; error: string | null }
  | { kind: "confirm-delete"; error: string | null }
  | { kind: "busy"; action: RecoveryAction }
  | { kind: "done"; action: RecoveryAction };

const failureMessage = (code: string) =>
  code === "local_cache_unreadable"
    ? `${copyForCode(code)} Reload the page and try again.`
    : copyForCode(code);

const RecoveryDialogSteps = ({ api }: { api: EngineAPI }) => {
  const account = useAccountStatus();
  const [step, setStep] = useState<RecoveryStep>({
    kind: "choose",
    error: null,
  });

  const run = async (action: RecoveryAction) => {
    setStep({ kind: "busy", action });
    const result =
      action === "keep"
        ? await api.auth.logout()
        : await api.auth.logout({ clearLocalData: true });
    if (result.ok) {
      setStep({ kind: "done", action });
      return;
    }
    const error = failureMessage(result.error.code);
    setStep(
      action === "keep"
        ? { kind: "choose", error }
        : { kind: "confirm-delete", error }
    );
  };

  if (step.kind === "busy") {
    return (
      <p
        role="status"
        className="flex items-center justify-center gap-2 py-6 text-sm"
      >
        <Loader2 className="size-4 animate-spin" />
        {step.action === "keep" ? "Logging out…" : "Deleting data…"}
      </p>
    );
  }

  if (step.kind === "done") {
    return (
      <div className="flex flex-col gap-3">
        <p role="status" className="text-sm">
          {step.action === "keep"
            ? "Logged out. Your data was kept on this device. Log in again to retry."
            : "Logged out and this device's data was deleted. Log in to download your data again."}
        </p>
        <Button
          className="self-start"
          onClick={() => {
            closeRecoveryDialog();
            openLoginDialog();
          }}
        >
          Log in
        </Button>
      </div>
    );
  }

  if (step.kind === "confirm-delete") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">
          Unsynced changes on this device will be lost.
        </p>
        {step.error !== null && (
          <p role="alert" className="text-sm text-destructive">
            {step.error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" onClick={() => void run("delete")}>
            Delete and resync
          </Button>
          <Button
            variant="outline"
            onClick={() => setStep({ kind: "choose", error: null })}
          >
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
      {step.error !== null && (
        <p role="alert" className="text-sm text-destructive">
          {step.error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void run("keep")}>Keep and retry</Button>
        <Button
          variant="outline"
          onClick={() => setStep({ kind: "confirm-delete", error: null })}
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
          <RecoveryDialogSteps api={engine.api} />
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};
