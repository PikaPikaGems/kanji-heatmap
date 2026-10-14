import { useState } from "react";
import type { EngineAPI } from "engine-contract";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { outLinks } from "@/lib/external-links";
import { rememberAccountEmail } from "@/lib/engine/account-email";
import type { ActionStatus } from "./action-status";
import { loginFailureMessage } from "./login-failure";
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
      <Button
        variant="ghost"
        size="sm"
        className="self-start -ml-2"
        onClick={() => onAction("back")}
      >
        <ArrowLeft />
        Back
      </Button>
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
      <p className="text-xs text-muted-foreground">
        If you can&apos;t log in, email us at{" "}
        <a
          href={outLinks.email}
          className="underline rounded-md hover:bg-neon-accent hover:text-black"
        >
          admin@pikapikagems.com
        </a>
      </p>
    </>
  );
};
