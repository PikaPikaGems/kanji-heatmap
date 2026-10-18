import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  CircleCheck,
  CircleX,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { ResponsiveSelect } from "@/components/common/ResponsiveSelect";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DEFAULT_AI_EXPLAIN_MODEL,
  hasValidAiExplainKey,
  readAiOwnerKey,
  writeAiOwnerKey,
} from "@/lib/ai-explain/preferences";
import { SavedAiContentLoading } from "@/components/common/OwnedAiContent";
import { GUEST_OWNER_ID, useCurrentOwner } from "@/lib/engine/content-owner";
import { cnDottedUnderlineTrigger, cnWarningText } from "@/lib/generic-cn";
import { checkXaiKey, listXaiModels } from "@/lib/ai-explain/xai";
import { useEditedPromptCount } from "@/hooks/use-prompt-entries";
import { cn } from "@/lib/utils";
import {
  GeneratedStorageSettings,
  ImageSettings,
  PromptSettings,
  SpeechSettings,
} from "./ai-explain/ExpandedAiSettings";

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

type ModelList =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; models: string[] }
  | { status: "error"; message: string };

const DEFAULT_MODEL_OPTION = "__default__";
const CUSTOM_MODEL_OPTION = "__custom__";

const ModelField = () => {
  const [settings, update] = useAiExplainSettings();
  const [list, setList] = useState<ModelList>({ status: "idle" });
  const [customOpen, setCustomOpen] = useState(false);
  const id = useId();

  // Effect needed: fetches this key's models from xAI when the section opens;
  // render can't await a request, and the result must be ignored after unmount.
  useEffect(() => {
    if (settings.apiKey === "") return;
    let active = true;
    setList({ status: "loading" });
    listXaiModels(settings.apiKey).then(
      (models) => active && setList({ status: "done", models }),
      (error: unknown) =>
        active &&
        setList({
          status: "error",
          message: error instanceof Error ? error.message : "",
        })
    );
    return () => {
      active = false;
    };
  }, [settings.apiKey]);

  // The default model is already the first option.
  const models =
    list.status === "done"
      ? list.models.filter((model) => model !== DEFAULT_AI_EXPLAIN_MODEL)
      : [];
  const current = settings.model;
  const options = [
    {
      value: DEFAULT_MODEL_OPTION,
      label: `Default (${DEFAULT_AI_EXPLAIN_MODEL})`,
    },
    ...models.map((model) => ({ value: model, label: model })),
    // Keep a saved model that isn't (or isn't yet) in the list selectable.
    ...(current !== undefined && !models.includes(current)
      ? [{ value: current, label: current }]
      : []),
    { value: CUSTOM_MODEL_OPTION, label: "Type a model name…" },
  ];

  return (
    <div className="mb-4 space-y-1">
      <p aria-hidden className="text-sm font-semibold">
        Model
      </p>
      <ResponsiveSelect
        isLabelSrOnly
        label="Model"
        value={
          customOpen ? CUSTOM_MODEL_OPTION : (current ?? DEFAULT_MODEL_OPTION)
        }
        onChange={(next) => {
          if (next === CUSTOM_MODEL_OPTION) {
            setCustomOpen(true);
            return;
          }
          setCustomOpen(false);
          update({ model: next === DEFAULT_MODEL_OPTION ? undefined : next });
        }}
        options={options}
      />
      {customOpen && (
        <Input
          className="rounded-lg"
          id={id}
          aria-label="Model name"
          value={current ?? ""}
          onChange={(e) =>
            update({ model: e.target.value.trim() || undefined })
          }
          placeholder={DEFAULT_AI_EXPLAIN_MODEL}
          autoComplete="off"
          spellCheck={false}
          autoFocus
        />
      )}
      <p className="pt-1 text-xs text-muted-foreground">
        {list.status === "loading" && "Loading your models… "}
        {list.status === "error" && `Couldn't load models. ${list.message} `}
        Models come from your xAI account.
      </p>
    </div>
  );
};

const formatTokens = (n: number) => n.toLocaleString("en-US");

/** The budget only; this month's usage is in App & Device Info. */
const BudgetField = () => {
  const [settings, update] = useAiExplainSettings();
  const budget = settings.monthlyTokenBudget;
  const id = useId();
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block mb-1 text-sm font-semibold">
        Monthly text-token budget (optional)
      </label>
      <Input
        className="rounded-lg"
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        step={1000}
        value={budget ?? ""}
        onChange={(e) => {
          const next = Math.floor(Number(e.target.value));
          update({ monthlyTokenBudget: next > 0 ? next : undefined });
        }}
        placeholder="e.g. 500000"
      />
      <p className="pt-1 text-xs text-muted-foreground">
        Counted in this browser only, and restarts each month. Requests
        incomplete or cancelled can still be billed. Local counters may omit
        these requests. This text-token budget is not a total spending limit for
        search, images, or speech, and nothing is blocked. This month&apos;s
        usage is in App & Device Info; your exact usage is at{" "}
        <ExternalTextLink href="https://console.x.ai" text="console.x.ai" />.
      </p>
    </div>
  );
};

/** A collapsible group inside the section, styled like Fill in the Kanji downloads. */
const SubsectionItem = ({
  value,
  title,
  subtitle,
  children,
}: {
  value: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <AccordionItem value={value} className="border-b-0">
    <AccordionTrigger className="py-3 text-left hover:no-underline">
      <span className="flex flex-col">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs font-normal text-muted-foreground">
          {subtitle}
        </span>
      </span>
    </AccordionTrigger>
    <AccordionContent className="pt-1.5 pb-1.5 pl-3 pr-1.5 border-l-2 border-dotted">
      {children}
    </AccordionContent>
  </AccordionItem>
);

const Subsections = () => {
  const [settings] = useAiExplainSettings();
  const editedPrompts = useEditedPromptCount();

  return (
    <Accordion type="multiple">
      <SubsectionItem
        value="customizations"
        title="Customizations"
        subtitle={`Model · ${settings.model ?? DEFAULT_AI_EXPLAIN_MODEL}`}
      >
        <ModelField />
      </SubsectionItem>
      <SubsectionItem
        value="images"
        title="Visual Mnemonics"
        subtitle="Image model, size, and quality"
      >
        <ImageSettings />
      </SubsectionItem>
      <SubsectionItem
        value="speech"
        title="Read Aloud"
        subtitle="Voice, language, and MP3 quality"
      >
        <SpeechSettings />
      </SubsectionItem>
      <SubsectionItem
        value="prompts"
        title="Prompts (advanced)"
        subtitle={
          editedPrompts === 0
            ? "All prompts use the defaults"
            : `${editedPrompts} edited ${editedPrompts === 1 ? "prompt" : "prompts"}`
        }
      >
        <PromptSettings />
      </SubsectionItem>
      <SubsectionItem
        value="storage"
        title="Generated content"
        subtitle="Delete what's saved on this device"
      >
        <GeneratedStorageSettings />
      </SubsectionItem>
      <SubsectionItem
        value="usage"
        title="Monthly budget"
        subtitle={
          settings.monthlyTokenBudget === undefined
            ? "No text-token budget set"
            : `${formatTokens(settings.monthlyTokenBudget)} text tokens a month`
        }
      >
        <BudgetField />
      </SubsectionItem>
    </Accordion>
  );
};

/** The key, switch and settings of one owner. */
const OwnedAiExplainControls = ({ ownerId }: { ownerId: string }) => {
  const [settings, update] = useAiExplainSettings();
  const keyOk = hasValidAiExplainKey(settings);
  // The saved choice is kept while the key is missing or rejected, so a
  // working key turns it back on.
  const active = settings.enabled && keyOk;

  return (
    <>
      <ApiKeyField ownerId={ownerId} />
      <div className="flex items-center py-2">
        <Switch
          checked={active}
          disabled={!keyOk}
          onCheckedChange={(enabled) => update({ enabled })}
          aria-label="Enable AI Study Tools"
        />
        <span
          className={cn(
            "px-2 text-sm font-semibold",
            !keyOk && "text-muted-foreground"
          )}
        >
          Enable AI Study Tools
        </span>
      </div>
      {!keyOk && (
        <p className="text-xs text-muted-foreground">
          Add a Grok API key that works to turn this on.
        </p>
      )}
      {active && (
        <p
          role="note"
          className={cn(
            "p-2 mb-3 text-xs border rounded-lg animate-fade-in-fast border-amber-500/50",
            cnWarningText
          )}
        >
          Heads up: what you generate is saved only in this browser. It
          isn&apos;t backed up and can be lost if browser data is cleared, and
          anyone using this computer can see it. Download anything you want to
          keep.
        </p>
      )}
      {active && <Subsections />}
    </>
  );
};

export const AiExplainSection = () => {
  const owner = useCurrentOwner();

  return (
    <SimpleAccordion trigger="AI Study Tools (Experimental)">
      <div className="mx-1 text-left">
        <p className="mb-3 text-xs text-muted-foreground">
          Ask Grok about sentences, anchor words, and kanji essays. Generate
          visual mnemonics and MP3 narration. Requests use your xAI account.
        </p>
        {/* Until we know whose key this is, show none. */}
        {owner.status === "unknown" ? (
          <SavedAiContentLoading />
        ) : (
          <div key={owner.ownerId} className="animate-fade-in-fast">
            <OwnedAiExplainControls ownerId={owner.ownerId} />
          </div>
        )}
      </div>
    </SimpleAccordion>
  );
};
