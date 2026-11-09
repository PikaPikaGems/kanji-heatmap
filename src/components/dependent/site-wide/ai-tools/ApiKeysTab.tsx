import { useId, useRef, useState } from "react";
import {
  CircleCheck,
  CircleX,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import {
  readAiOwnerKeys,
  writeAiProviderKey,
} from "@/lib/ai-explain/preferences";
import { clientOf } from "@/lib/ai-explain/providers";
import {
  AI_PROVIDER_ORDER,
  AI_PROVIDERS,
  AI_TOOLS,
  toolsOfProvider,
} from "@/lib/ai-explain/providers/capabilities";
import type { AiProvider } from "@/lib/ai-explain/providers/types";
import { GUEST_OWNER_ID } from "@/lib/engine/content-owner";
import { cnDottedUnderlineTrigger, cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

/** A check in progress or its failure; a pass is saved as `keyValid`. */
type KeyCheck =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "rejected" }
  | { status: "unreachable"; message: string };

const CheckAgainButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    className={cn(cnDottedUnderlineTrigger, "text-xs text-foreground")}
    onClick={onClick}
  >
    Check key
  </button>
);

/** Shown under the key field: checking, works, rejected or not checked. */
const KeyCheckStatus = ({
  label,
  check,
  keyValid,
  onCheck,
}: {
  label: string;
  check: KeyCheck;
  keyValid: boolean;
  onCheck: () => void;
}) => {
  if (check.status === "checking") {
    return (
      <p className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" /> Checking key…
      </p>
    );
  }
  if (keyValid) {
    return (
      <p className="flex items-center gap-1 pt-1 text-xs text-green-600 dark:text-green-500">
        <CircleCheck className="size-3.5" /> Key works
      </p>
    );
  }
  if (check.status === "rejected") {
    return (
      <p className={cn("flex items-center gap-1 pt-1 text-xs", cnWarningText)}>
        <CircleX className="size-3.5 shrink-0" /> {label} rejected this key. It
        may be mistyped, expired or revoked.
      </p>
    );
  }
  if (check.status === "unreachable") {
    return (
      <p className="flex flex-wrap items-center gap-1 pt-1 text-xs text-muted-foreground">
        {check.message ||
          `Couldn't check the key right now (network or ${label} error).`}
        <CheckAgainButton onClick={onCheck} />
      </p>
    );
  }
  return (
    <p className="flex flex-wrap items-center gap-1 pt-1 text-xs text-muted-foreground">
      This key hasn&apos;t been accepted by {label} yet.
      <CheckAgainButton onClick={onCheck} />
    </p>
  );
};

/** Wait after the last keystroke before checking, so typing isn't checked per letter. */
const KEY_CHECK_DELAY_MS = 600;

/**
 * One provider's key of one owner: the field, its check and where to get one.
 * Remounts for the next owner, so it never shows theirs.
 */
const ProviderKeyCard = ({
  ownerId,
  provider,
}: {
  ownerId: string;
  provider: AiProvider;
}) => {
  const [settings] = useAiExplainSettings();
  const [visible, setVisible] = useState(false);
  const [check, setCheck] = useState<KeyCheck>({ status: "idle" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();
  const info = AI_PROVIDERS[provider];
  const key = settings.keys[provider];
  const tools = toolsOfProvider(provider);

  const runCheck = (apiKey: string) => {
    setCheck({ status: "checking" });
    // A result for a key that has since changed is dropped. It is saved for
    // the owner who typed the key, even if someone else is logged in by then.
    const stillCurrent = () =>
      readAiOwnerKeys(ownerId)[provider].apiKey === apiKey;
    clientOf(provider)
      .checkKey(apiKey)
      .then(
        (result) => {
          if (!stillCurrent()) return;
          writeAiProviderKey(ownerId, provider, {
            apiKey,
            keyValid: result === "valid",
          });
          setCheck(
            result === "valid" ? { status: "idle" } : { status: result }
          );
        },
        (error: unknown) => {
          if (!stillCurrent()) return;
          setCheck({
            status: "unreachable",
            // A TypeError is a failed fetch: no network, or blocked.
            message:
              error instanceof Error && !(error instanceof TypeError)
                ? error.message
                : "",
          });
        }
      );
  };

  const onKeyChange = (apiKey: string) => {
    writeAiProviderKey(ownerId, provider, { apiKey, keyValid: false });
    clearTimeout(timerRef.current);
    if (apiKey === "") {
      setCheck({ status: "idle" });
      return;
    }
    setCheck({ status: "checking" });
    timerRef.current = setTimeout(() => runCheck(apiKey), KEY_CHECK_DELAY_MS);
  };

  return (
    <section className="p-3 space-y-1 border rounded-xl">
      <label htmlFor={id} className="block text-sm font-semibold">
        {info.label}
      </label>
      <p className="text-xs text-muted-foreground">
        For {tools.map((tool) => AI_TOOLS[tool].label).join(", ")}
      </p>
      <div className="flex gap-2 pt-1">
        <Input
          className="rounded-lg"
          id={id}
          type={visible ? "text" : "password"}
          value={key.apiKey}
          onChange={(e) => onKeyChange(e.target.value.trim())}
          placeholder={info.keyPlaceholder}
          autoComplete="off"
          spellCheck={false}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide API key" : "Show API key"}
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => onKeyChange("")}
          disabled={key.apiKey === ""}
          aria-label={`Delete ${info.label} API key`}
        >
          <Trash2 />
        </Button>
      </div>
      {key.apiKey !== "" && (
        <KeyCheckStatus
          label={info.label}
          check={check}
          keyValid={key.keyValid}
          onCheck={() => runCheck(key.apiKey)}
        />
      )}
      <p className="pt-1 text-xs text-muted-foreground">
        Get a key at{" "}
        <ExternalTextLink href={info.keyUrl} text={info.keyUrlText} />.
        {info.keyPermissions &&
          ` A restricted key needs: ${info.keyPermissions}.`}
      </p>
    </section>
  );
};

/** A key card per provider that can power at least one tool. */
export const ApiKeysTab = ({ ownerId }: { ownerId: string }) => (
  <div className="space-y-3">
    <p className="text-xs text-muted-foreground">
      Keys are saved only in this browser
      {ownerId === GUEST_OWNER_ID ? "" : ", for your account only,"} and each is
      sent only to its provider. Requests are billed to your account there. Your
      keys and custom prompts aren&apos;t private: anyone using this browser can
      see them.
    </p>
    {AI_PROVIDER_ORDER.filter(
      (provider) => toolsOfProvider(provider).length > 0
    ).map((provider) => (
      <ProviderKeyCard key={provider} ownerId={ownerId} provider={provider} />
    ))}
  </div>
);
