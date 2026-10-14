import { useState } from "react";
import type { EngineAPI } from "engine-contract";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { outLinks } from "@/lib/external-links";
import type { ActionStatus } from "./action-status";
import { loginFailureMessage } from "./login-failure";
import { SubmitInput } from "./SubmitInput";

export const LoginEmailStep = ({
  api,
  initialEmail,
  onSent,
}: {
  api: EngineAPI;
  initialEmail: string;
  onSent: (email: string) => void;
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<ActionStatus>({ kind: "idle" });

  const requestPin = async () => {
    const trimmed = email.trim();
    setStatus({ kind: "busy" });
    const result = await api.auth.requestPin({ email: trimmed });
    if (result.ok) {
      onSent(trimmed);
      return;
    }
    const message = loginFailureMessage(result.error.code);
    setStatus(message === null ? { kind: "idle" } : { kind: "error", message });
  };

  return (
    <>
      <p className="text-sm">
        Enter your existing Kanji Heatmap Premium account email to receive a
        login code. ⚠️ This form does not create new accounts.
      </p>
      <SubmitInput
        label="Premium account email"
        submitLabel="Send login code"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
        value={email}
        onValueChange={setEmail}
        status={status}
        onSubmit={() => void requestPin()}
      />
      <p className="text-xs text-muted-foreground">
        New? Message us on{" "}
        <ExternalTextLink
          href={outLinks.twitter}
          text="X/Twitter"
          className="p-0"
        />
        ,{" "}
        <ExternalTextLink
          href={outLinks.discord}
          text="Discord"
          className="p-0"
        />
        , or{" "}
        <ExternalTextLink
          href={outLinks.instagram}
          text="Instagram"
          className="p-0"
        />{" "}
        to join the waitlist.
      </p>
    </>
  );
};
