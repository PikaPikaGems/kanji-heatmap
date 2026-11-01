import { useRef, useState, type RefObject } from "react";
import type { EngineAPI } from "engine-contract";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import LinkOutIcon from "@/components/common/LinkOutIcon";
import { CONTACT_ITEMS } from "./contact-items";
import { outLinks } from "@/lib/external-links";
import type { ActionStatus } from "./action-status";
import { loginFailureMessage } from "./login-failure";
import { SubmitInput } from "./SubmitInput";

/** An emoji and its link, kept together on one line. */
const WaitlistLink = ({
  emoji,
  href,
  text,
}: {
  emoji: string;
  href: string;
  text: string;
}) => (
  <span className="whitespace-nowrap">
    <span aria-hidden>{emoji}</span>{" "}
    <ExternalTextLink href={href} text={text} className="p-0" />
  </span>
);

/**
 * The `website` field sent with the login code request. Off-screen, and kept
 * out of screen readers, the tab order and autofill.
 */
const WebsiteField = ({
  inputRef,
}: {
  inputRef: RefObject<HTMLInputElement>;
}) => (
  <div
    aria-hidden
    className="absolute -left-[10000px] top-auto size-px overflow-hidden"
  >
    <label>
      Website (leave this empty)
      <input
        ref={inputRef}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </label>
  </div>
);

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
  const websiteRef = useRef<HTMLInputElement>(null);

  const requestPin = async () => {
    const trimmed = email.trim();
    setStatus({ kind: "busy" });
    // Always sent; an empty string when the field is empty.
    const result = await api.auth.requestPin({
      email: trimmed,
      website: websiteRef.current?.value ?? "",
    });
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
      >
        <WebsiteField inputRef={websiteRef} />
      </SubmitInput>
      <div className="flex flex-col items-center gap-3 pt-4 border-t-2 border-dashed">
        <p className="text-sm font-bold text-center text-foreground text-pretty">
          Most features of Kanji Heatmap will always be free, no login required
          💝
        </p>
        <p className="text-sm text-center text-foreground text-pretty">
          For premium features, message us on{" "}
          <WaitlistLink emoji="💬" href={outLinks.discord} text="Discord" />,{" "}
          <WaitlistLink emoji="🐦" href={outLinks.twitter} text="X/Twitter" />{" "}
          or{" "}
          <WaitlistLink emoji="📷" href={outLinks.instagram} text="Instagram" />
          .
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {CONTACT_ITEMS.map((item) => (
            <LinkOutIcon
              key={item.href}
              href={item.href}
              hoverText={item.text}
              srOnlyText={item.text}
              icon={item.icon}
            />
          ))}
        </div>
      </div>
    </>
  );
};
