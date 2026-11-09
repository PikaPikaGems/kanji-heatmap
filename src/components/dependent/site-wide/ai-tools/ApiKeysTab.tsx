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
import { readAiOwnerKey, writeAiOwnerKey } from "@/lib/ai-explain/preferences";
import { GUEST_OWNER_ID } from "@/lib/engine/content-owner";
import { cnDottedUnderlineTrigger } from "@/lib/generic-cn";
import { checkXaiKey } from "@/lib/ai-explain/xai";
import { cn } from "@/lib/utils";

/** A check in progress or its failure; a pass is saved as `keyValid`. */
type KeyCheck =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "rejected" }
  | { status: "unreachable" };

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
  check,
  keyValid,
  onCheck,
}: {
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
      <p className="flex items-center gap-1 pt-1 text-xs text-red-500">
        <CircleX className="size-3.5" /> xAI rejected this key. It may be
        mistyped, expired or revoked.
      </p>
    );
  }
  if (check.status === "unreachable") {
    return (
      <p className="flex flex-wrap items-center gap-1 pt-1 text-xs text-muted-foreground">
        Couldn&apos;t check the key right now (network or xAI error).
        <CheckAgainButton onClick={onCheck} />
      </p>
    );
  }
  return (
    <p className="flex flex-wrap items-center gap-1 pt-1 text-xs text-muted-foreground">
      This key hasn&apos;t been accepted by xAI yet.
      <CheckAgainButton onClick={onCheck} />
    </p>
  );
};

/** Wait after the last keystroke before checking, so typing isn't checked per letter. */
const KEY_CHECK_DELAY_MS = 600;

/** Edits the key of one owner; remounts for the next owner, never shows theirs. */
const ApiKeyField = ({ ownerId }: { ownerId: string }) => {
  const [settings] = useAiExplainSettings();
  const [visible, setVisible] = useState(false);
  const [check, setCheck] = useState<KeyCheck>({ status: "idle" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();

  const runCheck = (apiKey: string) => {
    setCheck({ status: "checking" });
    // A result for a key that has since changed is dropped. It is saved for
    // the owner who typed the key, even if someone else is logged in by then.
    const stillCurrent = () => readAiOwnerKey(ownerId).apiKey === apiKey;
    checkXaiKey(apiKey).then(
      (result) => {
        if (!stillCurrent()) return;
        writeAiOwnerKey(ownerId, { apiKey, keyValid: result === "valid" });
        setCheck(result === "valid" ? { status: "idle" } : { status: result });
      },
      () => {
        if (!stillCurrent()) return;
        setCheck({ status: "unreachable" });
      }
    );
  };

  const onKeyChange = (apiKey: string) => {
    writeAiOwnerKey(ownerId, { apiKey, keyValid: false });
    clearTimeout(timerRef.current);
    if (apiKey === "") {
      setCheck({ status: "idle" });
      return;
    }
    setCheck({ status: "checking" });
    timerRef.current = setTimeout(() => runCheck(apiKey), KEY_CHECK_DELAY_MS);
  };

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block mb-1 text-sm font-semibold">
        Grok API Key
      </label>
      <div className="flex gap-2">
        <Input
          className="rounded-lg"
          id={id}
          type={visible ? "text" : "password"}
          value={settings.apiKey}
          onChange={(e) => onKeyChange(e.target.value.trim())}
          placeholder="xai-…"
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
          disabled={settings.apiKey === ""}
          aria-label="Delete API key"
        >
          <Trash2 />
        </Button>
      </div>
      {settings.apiKey !== "" && (
        <KeyCheckStatus
          check={check}
          keyValid={settings.keyValid}
          onCheck={() => runCheck(settings.apiKey)}
        />
      )}
      <p className="pt-1 text-xs text-muted-foreground">
        Saved only in this browser
        {ownerId === GUEST_OWNER_ID ? "" : ", for your account only,"} and sent
        only to xAI. Requests are billed to your xAI account. Get a key at{" "}
        <ExternalTextLink href="https://console.x.ai" text="console.x.ai" />.
        Your key and custom prompts aren&apos;t private: anyone using this
        browser can see them.
      </p>
    </div>
  );
};

export const ApiKeysTab = ({ ownerId }: { ownerId: string }) => (
  <ApiKeyField ownerId={ownerId} />
);
