import { useState } from "react";
import type { EngineAPI } from "engine-contract";
import { ArrowLeft } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { rememberAccountEmail } from "@/lib/engine/account-email";
import type { ActionStatus } from "./action-status";
import { loginFailureMessage } from "./login-failure";
import { LetUsKnowLine } from "./LetUsKnow";
import { SubmitInput } from "./SubmitInput";

export const LoginCodeStep = ({
  api,
  email,
  onAction,
}: {
  api: EngineAPI;
  email: string;
  onAction: (action: "back" | "verified") => void;
}) => {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<ActionStatus>({ kind: "idle" });

  const verifyPin = async () => {
    setStatus({ kind: "busy" });
    const result = await api.auth.verifyPin({ email, pin: pin.trim() });
    if (result.ok) {
      rememberAccountEmail(email);
      onAction("verified");
      return;
    }
    const message = loginFailureMessage(result.error.code);
    setStatus(message === null ? { kind: "idle" } : { kind: "error", message });
  };

  return (
    <>
      <TextActionButton
        className="self-start -ml-1"
        icon={<ArrowLeft aria-hidden size={14} />}
        onClick={() => onAction("back")}
      >
        Back
      </TextActionButton>
      <p className="text-sm">
        Check your email (or Spam folder) — your verification code should arrive
        within 5 minutes.
      </p>
      <SubmitInput
        label="Verification code"
        submitLabel="Log in"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
        value={pin}
        onValueChange={setPin}
        status={status}
        onSubmit={() => void verifyPin()}
      />
      <LetUsKnowLine
        modal
        before="If you can't log in, "
        after="."
        className="pt-4 border-t-2 border-dashed"
      />
    </>
  );
};
