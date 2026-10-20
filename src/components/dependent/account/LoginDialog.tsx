import { useState } from "react";
import type { EngineAPI } from "engine-contract";
import { Dialog } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useEngineState } from "@/lib/engine/engine";
import { copyForCode } from "@/lib/engine/engine-copy";
import { closeLoginDialog, useLoginDialog } from "@/lib/engine/login-dialog";
import { PikaPikaLinks } from "@/components/common/PikaPikaLinks";
import { LoginCodeStep } from "./LoginCodeStep";
import { LoginDownloadingStep } from "./LoginDownloadingStep";
import { LoginEmailStep } from "./LoginEmailStep";

type LoginStep =
  | { kind: "email"; email: string }
  | { kind: "code"; email: string }
  | { kind: "downloading"; error: string | null };

/**
 * A click outside never closes the dialog (a stray click would lose a typed
 * email or code). It is "locked" while the data downloads after logging in
 * (no X and no Escape either).
 */
const isLocked = (step: LoginStep) =>
  step.kind === "downloading" && step.error === null;

const LoginStepScreen = ({
  api,
  step,
  onStep,
  onDownload,
}: {
  api: EngineAPI;
  step: LoginStep;
  onStep: (step: LoginStep) => void;
  onDownload: () => void;
}) => {
  if (step.kind === "downloading") {
    return <LoginDownloadingStep error={step.error} onRetry={onDownload} />;
  }
  if (step.kind === "code") {
    return (
      <LoginCodeStep
        api={api}
        email={step.email}
        onAction={(action) => {
          if (action === "back") {
            onStep({ kind: "email", email: step.email });
            return;
          }
          onDownload();
        }}
      />
    );
  }
  return (
    <LoginEmailStep
      api={api}
      initialEmail={step.email}
      onSent={(email) => onStep({ kind: "code", email })}
    />
  );
};

const LoginDialogFlow = ({ api, open }: { api: EngineAPI; open: boolean }) => {
  const [step, setStep] = useState<LoginStep>({ kind: "email", email: "" });
  const locked = isLocked(step);

  const download = async () => {
    setStep({ kind: "downloading", error: null });
    const result = await api.sync.catchUp();
    if (result.ok) {
      closeLoginDialog();
      return;
    }
    setStep({ kind: "downloading", error: copyForCode(result.error.code) });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !locked) closeLoginDialog();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title="Log in to Continue"
        description="Log in to your Kanji Heatmap Premium account with an email code"
        titleClassName="text-left"
        hideClose={locked}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="flex flex-col gap-4 px-2 pt-2 text-left">
          {/* Each step fades in as it replaces the last. */}
          <div
            key={step.kind}
            className="flex flex-col gap-4 animate-fade-in-fast"
          >
            <LoginStepScreen
              api={api}
              step={step}
              onStep={setStep}
              onDownload={() => void download()}
            />
          </div>
          <div className="pt-4 border-t border-dotted">
            <PikaPikaLinks />
          </div>
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};

/**
 * The one app-wide "Log in to Continue" dialog (design 5.2), mounted once in App.
 * Opened with `openLoginDialog()`. Renders nothing until the engine is ready,
 * so builds and browsers without the engine never show it.
 */
export const LoginDialog = () => {
  const { open, session } = useLoginDialog();
  const engine = useEngineState();
  if (engine.status !== "ready") return null;

  // A new key per opening, so the steps start over each time.
  return <LoginDialogFlow key={session} api={engine.api} open={open} />;
};
