import { useId, useRef, useState, type ReactNode } from "react";
import {
  CircleCheck,
  CircleX,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import {
  useAiExplainSettings,
  useAiExplainUsage,
} from "@/hooks/use-ai-explain";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DEFAULT_AI_EXPLAIN_MODEL,
  DEFAULT_AI_EXPLAIN_PROMPT,
  hasValidAiExplainKey,
  JAPANESE_TEXT_PLACEHOLDER,
  readAiExplainSettings,
} from "@/lib/ai-explain/preferences";
import { cnDottedUnderlineTrigger } from "@/lib/generic-cn";
import { checkXaiKey, listXaiModels } from "@/lib/ai-explain/xai";
import { cn } from "@/lib/utils";
import {
  GeneratedStorageSettings,
  ImageSettings,
  SearchedPromptSettings,
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

const ApiKeyField = () => {
  const [settings, update] = useAiExplainSettings();
  const [visible, setVisible] = useState(false);
  const [check, setCheck] = useState<KeyCheck>({ status: "idle" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();

  const runCheck = (apiKey: string) => {
    setCheck({ status: "checking" });
    // A result for a key that has since changed is dropped.
    const stillCurrent = () => readAiExplainSettings().apiKey === apiKey;
    checkXaiKey(apiKey).then(
      (result) => {
        if (!stillCurrent()) return;
        update({ keyValid: result === "valid" });
        setCheck(result === "valid" ? { status: "idle" } : { status: result });
      },
      () => {
        if (!stillCurrent()) return;
        setCheck({ status: "unreachable" });
      }
    );
  };

  const onKeyChange = (apiKey: string) => {
    update({ apiKey, keyValid: false });
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
        Saved only in this browser and sent only to xAI. Requests are billed to
        your xAI account. Get a key at{" "}
        <ExternalTextLink href="https://console.x.ai" text="console.x.ai" />.
      </p>
    </div>
  );
};

type ModelList =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; models: string[] }
  | { status: "error"; message: string };

const ModelField = () => {
  const [settings, update] = useAiExplainSettings();
  const [list, setList] = useState<ModelList>({ status: "idle" });
  const id = useId();
  const listId = `${id}-models`;

  // Loaded on first focus, so the key's models are offered as suggestions
  // without a hardcoded list.
  const loadModels = () => {
    if (settings.apiKey === "") return;
    if (list.status === "loading" || list.status === "done") return;
    setList({ status: "loading" });
    listXaiModels(settings.apiKey).then(
      (models) => setList({ status: "done", models }),
      (error: unknown) =>
        setList({
          status: "error",
          message: error instanceof Error ? error.message : "",
        })
    );
  };

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block mb-1 text-sm font-semibold">
        Model
      </label>
      <Input
        id={id}
        list={listId}
        value={settings.model ?? ""}
        onFocus={loadModels}
        onChange={(e) => update({ model: e.target.value.trim() || undefined })}
        placeholder={DEFAULT_AI_EXPLAIN_MODEL}
        autoComplete="off"
        spellCheck={false}
      />
      <datalist id={listId}>
        {list.status === "done" &&
          list.models.map((model) => <option key={model} value={model} />)}
      </datalist>
      <p className="pt-1 text-xs text-muted-foreground">
        {list.status === "loading" && "Loading your models… "}
        {list.status === "error" && `Couldn't load models. ${list.message} `}
        Leave empty for {DEFAULT_AI_EXPLAIN_MODEL}.
      </p>
    </div>
  );
};

const PromptField = () => {
  const [settings, update] = useAiExplainSettings();
  const id = useId();
  const prompt = settings.prompt ?? DEFAULT_AI_EXPLAIN_PROMPT;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="text-sm font-semibold">
          Explain Prompt
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => update({ prompt: undefined })}
          disabled={settings.prompt === undefined}
        >
          <RotateCcw /> Reset to default
        </Button>
      </div>
      <textarea
        id={id}
        value={prompt}
        onChange={(e) => {
          const next = e.target.value;
          update({
            prompt: next === DEFAULT_AI_EXPLAIN_PROMPT ? undefined : next,
          });
        }}
        rows={12}
        spellCheck={false}
        className={cn(
          // Like the kanji drawer's study notes editor.
          "block w-full resize-none bg-background rounded-xl border-[3px] border-dotted border-border p-3.5",
          "font-mono text-base leading-[1.55rem] whitespace-pre-wrap break-words",
          "outline-none focus:border-ring focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring"
        )}
      />
      <p className="pt-1 text-xs text-muted-foreground">
        {prompt.includes(JAPANESE_TEXT_PLACEHOLDER)
          ? `${JAPANESE_TEXT_PLACEHOLDER} is replaced with the sentence.`
          : `${JAPANESE_TEXT_PLACEHOLDER} is missing, so the sentence is added at the end.`}
      </p>
    </div>
  );
};

const formatTokens = (n: number) => n.toLocaleString("en-US");

const UsageField = () => {
  const [settings, update] = useAiExplainSettings();
  const usage = useAiExplainUsage();
  const budget = settings.monthlyTokenBudget;
  const id = useId();
  return (
    <div className="mb-4">
      {/* The token and request counts are in the subsection's subtitle. */}
      {budget !== undefined && (
        <div className="mb-3">
          <p className="text-sm tabular-nums">
            {formatTokens(usage.tokens)} / {formatTokens(budget)} tokens
          </p>
          <Progress
            value={Math.min(100, (usage.tokens / budget) * 100)}
            className="h-2 mt-2"
            primitiveCn={usage.tokens > budget ? "bg-red-500" : undefined}
            aria-label="Tokens used of the monthly budget"
          />
        </div>
      )}
      <p className="mb-3 text-xs text-muted-foreground">
        Search calls: {usage.searchCalls} · Images: {usage.imageRequests} ·
        Audio generations: {usage.audioRequests} · Speech characters:{" "}
        {usage.audioCharacters}
        {usage.unreportedSearchRequests > 0 &&
          ` · ${usage.unreportedSearchRequests} searched requests without a provider-reported search count`}
      </p>
      {usage.reportedCostUsd > 0 && (
        <p className="mb-3 text-xs text-muted-foreground">
          Provider-reported charges: US${usage.reportedCostUsd.toFixed(4)}.
          Partial total for requests that returned cost data; check xAI for your
          full bill.
        </p>
      )}
      <label htmlFor={id} className="block mb-1 text-sm font-semibold">
        Monthly text-token budget (optional)
      </label>
      <Input
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
        search, images, or speech, and nothing is blocked. Your exact usage is
        at <ExternalTextLink href="https://console.x.ai" text="console.x.ai" />.
      </p>
    </div>
  );
};

/** A collapsible group inside the section, styled like Fill the Kanji downloads. */
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
    <AccordionContent className="pt-1 pb-0 pl-3 border-l-2 border-dotted">
      {children}
    </AccordionContent>
  </AccordionItem>
);

const Subsections = () => {
  const [settings] = useAiExplainSettings();
  const usage = useAiExplainUsage();
  const customized = [
    settings.prompt !== undefined && "custom prompt",
    settings.model !== undefined && "custom model",
  ].filter(Boolean);

  return (
    <Accordion type="multiple">
      <SubsectionItem
        value="customizations"
        title="Customizations"
        subtitle={`Prompt and model · ${
          customized.length > 0 ? customized.join(", ") : "defaults"
        }`}
      >
        <PromptField />
        <ModelField />
      </SubsectionItem>
      <SubsectionItem
        value="searched-text"
        title="Vocabulary and essays"
        subtitle="Prompts · uses paid web search"
      >
        <SearchedPromptSettings />
      </SubsectionItem>
      <SubsectionItem
        value="images"
        title="Visual Mnemonics"
        subtitle="Image size, quality, styles, and palette"
      >
        <ImageSettings />
      </SubsectionItem>
      <SubsectionItem
        value="speech"
        title="Read Aloud"
        subtitle="Voice and language"
      >
        <SpeechSettings />
      </SubsectionItem>
      <SubsectionItem
        value="storage"
        title="Generated content"
        subtitle="Saved space and deletion"
      >
        <GeneratedStorageSettings />
      </SubsectionItem>
      <SubsectionItem
        value="usage"
        title="Usage"
        subtitle={`This month: ${formatTokens(usage.tokens)} tokens · ${usage.requests} ${
          usage.requests === 1 ? "request" : "requests"
        }`}
      >
        <UsageField />
      </SubsectionItem>
    </Accordion>
  );
};

export const AiExplainSection = () => {
  const [settings, update] = useAiExplainSettings();
  const keyOk = hasValidAiExplainKey(settings);
  // The saved choice is kept while the key is missing or rejected, so a
  // working key turns it back on.
  const active = settings.enabled && keyOk;

  return (
    <SimpleAccordion trigger="AI Explain (Experimental)">
      <div className="mx-1 text-left">
        <p className="mb-3 text-xs text-muted-foreground">
          Ask Grok about sentences, anchor words, and kanji essays. Generate
          visual mnemonics and MP3 narration. Requests use your xAI account.
        </p>
        <ApiKeyField />
        <div className="flex items-center py-2">
          <Switch
            checked={active}
            disabled={!keyOk}
            onCheckedChange={(enabled) => update({ enabled })}
            aria-label="Enable AI Explain"
          />
          <span
            className={cn(
              "px-2 text-sm font-semibold",
              !keyOk && "text-muted-foreground"
            )}
          >
            Enable AI Explain
          </span>
        </div>
        {!keyOk && (
          <p className="text-xs text-muted-foreground">
            Add a Grok API key that works to turn this on.
          </p>
        )}
        {active && <Subsections />}
      </div>
    </SimpleAccordion>
  );
};
