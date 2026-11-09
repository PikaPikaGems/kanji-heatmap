import { useEffect, useId, useState, type ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/common/ResponsiveSelect";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DEFAULT_AI_EXPLAIN_MODEL,
  usesWebSearch,
} from "@/lib/ai-explain/preferences";
import { listXaiModels } from "@/lib/ai-explain/xai";
import { useEditedPromptCount } from "@/hooks/use-prompt-entries";
import { ImageSettings, PromptSettings, SpeechSettings } from "./ToolSettings";

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

/** Kanji Essay and Anchor Word can answer from memory instead of searching. */
const WebSearchField = () => {
  const [settings, update] = useAiExplainSettings();
  return (
    <div className="mb-3">
      <div className="flex items-center py-2">
        <Switch
          checked={usesWebSearch(settings)}
          onCheckedChange={(on) =>
            update({ noWebSearch: on ? undefined : true })
          }
          aria-label="Use web search for Kanji Essay and Anchor Word"
        />
        <span className="px-2 text-sm font-semibold">
          Use web search for Kanji Essay and Anchor Word
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Search finds sources and real-world examples, and is billed per search.
        Turn it off to have Grok answer from its own memory: cheaper, but with
        no source links and a higher chance of mistakes.
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
    </Accordion>
  );
};

/** Which model, provider and prompt each tool uses. */
export const ToolsTab = () => (
  <>
    <WebSearchField />
    <Subsections />
  </>
);
