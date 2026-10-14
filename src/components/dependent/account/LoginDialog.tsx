import { useState } from "react";
import type { EngineAPI } from "engine-contract";
import { Dialog } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useEngineState } from "@/lib/engine/engine";
import { copyForCode } from "@/lib/engine/engine-copy";
import {
  closeLoginDialog,
  useLoginDialogOpen,
} from "@/lib/engine/login-dialog";
import { LoginCodeStep } from "./LoginCodeStep";
import { LoginDownloadingStep } from "./LoginDownloadingStep";
import { LoginEmailStep } from "./LoginEmailStep";

type LoginStep =
  | { kind: "email"; email: string }
  | { kind: "code"; email: string }
  | { kind: "downloading"; error: string | null };

const LoginDialogSteps = ({ api }: { api: EngineAPI }) => {
  const [step, setStep] = useState<LoginStep>({ kind: "email", email: "" });

  const download = async () => {
    setStep({ kind: "downloading", error: null });
    const result = await api.sync.catchUp();
    if (result.ok) {
      closeLoginDialog();
      return;
    }
    setStep({ kind: "downloading", error: copyForCode(result.error.code) });
  };

  if (step.kind === "downloading") {
    return (
      <LoginDownloadingStep
        error={step.error}
        onRetry={() => void download()}
      />
    );
  }
  if (step.kind === "code") {
    return (
      <LoginCodeStep
        api={api}
        email={step.email}
        onAction={(action) => {
          if (action === "back") {
            setStep({ kind: "email", email: step.email });
            return;
          }
          void download();
        }}
      />
    );
  }
  return (
    <LoginEmailStep
      api={api}
      initialEmail={step.email}
      onSent={(email) => setStep({ kind: "code", email })}
    />
  );
};

/**
 * The one app-wide "Login required" dialog (design 5.2), mounted once in App.
 * Opened with `openLoginDialog()`. Renders nothing until the engine is ready,
 * so builds and browsers without the engine never show it.
 */
export const LoginDialog = () => {
  const open = useLoginDialogOpen();
  const engine = useEngineState();
  if (engine.status !== "ready") return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeLoginDialog();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title="Login required"
        description="Log in to your Kanji Heatmap Premium account with an email code"
        titleClassName="text-left"
      >
        <div className="flex flex-col gap-4 px-2 pt-2 text-left">
          <LoginDialogSteps api={engine.api} />
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};
