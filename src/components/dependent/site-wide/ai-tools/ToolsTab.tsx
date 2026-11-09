import BasicSelect from "@/components/common/BasicSelect";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import {
  hasValidKey,
  resolveAiTool,
  updateAiToolChoice,
  type AiExplainSettings,
  type ResolvedAiTool,
} from "@/lib/ai-explain/preferences";
import { setAiStudyToolsTab } from "@/lib/ai-explain/ai-tools-dialog";
import { modelFor } from "@/lib/ai-explain/providers";
import {
  AI_PROVIDERS,
  AI_TOOL_ORDER,
  AI_TOOLS,
  providerLabel,
  type AiTool,
} from "@/lib/ai-explain/providers/capabilities";
import { ModelField } from "./ModelField";
import { DownloadAllPrompts, ToolPrompts } from "./PromptFields";
import { ImageOptions, SpeechOptions, WebSearchField } from "./ToolOptions";

/**
 * The tool's provider: those with a key that works can be picked; the others
 * are listed as needing a key.
 */
const ProviderField = ({
  tool,
  settings,
  choice,
}: {
  tool: AiTool;
  settings: AiExplainSettings;
  choice: ResolvedAiTool;
}) => {
  const { providers } = AI_TOOLS[tool];
  if (!providers.some((provider) => hasValidKey(settings, provider)))
    return (
      <UserNotice className="text-xs">
        Needs a key from{" "}
        {providers.map((provider) => providerLabel(provider)).join(", ")}.{" "}
        <NoticeAction onClick={() => setAiStudyToolsTab("keys")}>
          Add a key
        </NoticeAction>
      </UserNotice>
    );
  return (
    <div className="space-y-1">
      <p aria-hidden className="text-sm font-semibold">
        Provider
      </p>
      <BasicSelect
        isLabelSrOnly
        triggerCN="rounded-lg"
        label="Provider"
        value={choice.provider}
        onChange={(provider) =>
          updateAiToolChoice(tool, {
            provider: providers.find((option) => option === provider),
          })
        }
        options={providers.map((provider) => ({
          value: provider,
          label: AI_PROVIDERS[provider].label,
          disabled: !hasValidKey(settings, provider),
          description: hasValidKey(settings, provider)
            ? undefined
            : "Add a key in API keys",
        }))}
      />
    </div>
  );
};

/** Everything one tool uses: provider, model, options and prompt. */
const ToolFields = ({ tool }: { tool: AiTool }) => {
  const [settings] = useAiExplainSettings();
  const info = AI_TOOLS[tool];
  const choice = resolveAiTool(settings, tool);
  const model = modelFor(choice.provider, info.kind, choice.model);
  const hasModels = AI_PROVIDERS[choice.provider].defaultModels[info.kind];
  return (
    <div className="space-y-4">
      <ProviderField tool={tool} settings={settings} choice={choice} />
      {choice.ready && (
        // Keyed by provider: its own fields fade in when it changes.
        <div key={choice.provider} className="space-y-4 animate-fade-in-fast">
          {hasModels && (
            <ModelField
              provider={choice.provider}
              kind={info.kind}
              apiKey={choice.apiKey}
              value={choice.model}
              onChange={(next) => updateAiToolChoice(tool, { model: next })}
            />
          )}
          {info.search && <WebSearchField tool={tool} choice={choice} />}
          {info.kind === "speech" && <SpeechOptions choice={choice} />}
          {info.kind === "image" && (
            <ImageOptions choice={choice} model={model} />
          )}
        </div>
      )}
      {/* Read Aloud's prompt is speaking instructions: OpenAI and Gemini only. */}
      {(info.kind !== "speech" ||
        AI_PROVIDERS[choice.provider].speech?.instructions) && (
        <ToolPrompts tool={tool} />
      )}
    </div>
  );
};

/** One tool's row: its name, and the provider and model it uses now. */
const ToolItem = ({ tool }: { tool: AiTool }) => {
  const [settings] = useAiExplainSettings();
  const info = AI_TOOLS[tool];
  const choice = resolveAiTool(settings, tool);
  const model = modelFor(choice.provider, info.kind, choice.model);
  return (
    <AccordionItem value={tool} className="border-b border-dotted">
      <AccordionTrigger className="py-3 text-left hover:no-underline">
        <span className="flex flex-col">
          <span className="text-sm font-semibold">{info.label}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {choice.ready
              ? [providerLabel(choice.provider), model]
                  .filter(Boolean)
                  .join(" · ")
              : "Needs a key"}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pt-1.5 pb-4 pl-3 pr-1.5 border-l-2 border-dotted">
        <p className="mb-3 text-xs text-muted-foreground">
          {info.description}.
        </p>
        <ToolFields tool={tool} />
      </AccordionContent>
    </AccordionItem>
  );
};

/** Which provider, model, options and prompt each tool uses. */
export const ToolsTab = () => (
  <div className="space-y-4">
    <Accordion type="multiple">
      {AI_TOOL_ORDER.map((tool) => (
        <ToolItem key={tool} tool={tool} />
      ))}
    </Accordion>
    <DownloadAllPrompts />
  </div>
);
