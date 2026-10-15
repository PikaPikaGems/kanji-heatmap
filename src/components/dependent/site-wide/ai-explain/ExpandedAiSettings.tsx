import { useEffect, useId, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveTextarea } from "@/components/common/ResponsiveTextarea";
import {
  DownloadMarkdownButton,
  TextActionButton,
} from "@/components/common/AiActionButtons";
import BasicSelect from "@/components/common/BasicSelect";
import {
  AI_SPEECH_BIT_RATES,
  AI_SPEECH_VOICES,
  DEFAULT_AI_SPEECH_BIT_RATE,
  type AiSpeechBitRate,
  DEFAULT_AI_SPEECH_VOICE,
} from "@/lib/ai-explain/preferences";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import { usePromptEntries } from "@/hooks/use-prompt-entries";
import { DEFAULT_AI_IMAGE_MODEL } from "@/lib/ai-explain/prompts";
import { OwnedAiContent } from "@/components/common/OwnedAiContent";

type PromptEditorProps = {
  title: string;
  value?: string;
  defaultValue: string;
  placeholders?: string;
  onChange: (value: string | undefined) => void;
};
const PromptEditor = ({
  title,
  value,
  defaultValue,
  placeholders,
  onChange,
}: PromptEditorProps) => {
  const id = useId();
  return (
    <div className="mb-4 space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <label htmlFor={id} className="text-sm font-semibold">
          {title}
        </label>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="rounded-lg"
          onClick={() => onChange(undefined)}
          disabled={value === undefined}
        >
          <RotateCcw /> Reset to default
        </Button>
      </div>
      <ResponsiveTextarea
        id={id}
        title={title}
        rows={10}
        value={value ?? defaultValue}
        onValueChange={(next) =>
          onChange(next === defaultValue ? undefined : next)
        }
        spellCheck={false}
      />
      {placeholders && (
        <p className="text-xs text-muted-foreground">
          Placeholders: {placeholders}
        </p>
      )}
    </div>
  );
};

const ImageGenerationSettings = () => {
  const [settings, update] = useAiExplainSettings();
  const id = useId();
  const model = settings.imageModel ?? DEFAULT_AI_IMAGE_MODEL;
  const supportsQuality = model === DEFAULT_AI_IMAGE_MODEL;
  return (
    <div className="mb-4 space-y-3">
      <label className="block text-sm font-semibold" htmlFor={`${id}-model`}>
        Image model
      </label>
      <Input
        className="rounded-lg"
        id={`${id}-model`}
        value={settings.imageModel ?? ""}
        placeholder={DEFAULT_AI_IMAGE_MODEL}
        onChange={(event) =>
          update({ imageModel: event.target.value.trim() || undefined })
        }
      />
      <div className="space-y-1">
        <p aria-hidden className="text-sm font-semibold">
          Resolution
        </p>
        <BasicSelect
          isLabelSrOnly
          triggerCN="rounded-lg"
          label="Resolution"
          value={settings.imageResolution ?? "1k"}
          onChange={(imageResolution) =>
            update({ imageResolution: imageResolution as "1k" | "2k" })
          }
          options={[
            { value: "1k", label: "1K (default)" },
            { value: "2k", label: "2K" },
          ]}
        />
      </div>
      {supportsQuality && (
        <>
          <div className="space-y-1">
            <p aria-hidden className="text-sm font-semibold">
              Quality
            </p>
            <BasicSelect
              isLabelSrOnly
              triggerCN="rounded-lg"
              label="Quality"
              value={settings.imageQuality ?? "low"}
              onChange={(imageQuality) =>
                update({ imageQuality: imageQuality as "low" | "medium" })
              }
              options={[
                { value: "low", label: "Standard (default)" },
                { value: "medium", label: "Higher detail" },
              ]}
            />
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground">
        Larger images and higher quality can cost more. Changes apply to future
        generations. Saved images keep their original settings.
        {!supportsQuality &&
          " Quality is controlled by this model; unsupported size options may be rejected."}
      </p>
      {supportsQuality && (
        <p className="text-xs text-muted-foreground">
          Estimated generation price: US$
          {((settings.imageQuality ?? "low") === "medium"
            ? (settings.imageResolution ?? "1k") === "2k"
              ? 0.08
              : 0.06
            : (settings.imageResolution ?? "1k") === "2k"
              ? 0.06
              : 0.04
          ).toFixed(2)}{" "}
          per image. Rates checked October 15, 2026;{" "}
          <a
            href="https://docs.x.ai/developers/models/grok-imagine-image-2.0"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            check current xAI pricing
          </a>
          .
        </p>
      )}
    </div>
  );
};

export const ImageSettings = ImageGenerationSettings;

/** One picker and one editor for every prompt, instead of a box per prompt. */
/** Every prompt in one file: a "#" heading per prompt and its text in a fence. */
const allPromptsMarkdown = (
  entries: { label: string; value?: string; defaultValue: string }[]
) =>
  entries
    .map((entry) => {
      const text = entry.value ?? entry.defaultValue;
      // A longer fence than any backtick run inside keeps the block intact.
      const longestRun = Math.max(
        0,
        ...(text.match(/`+/g) ?? []).map((run) => run.length)
      );
      const fence = "`".repeat(Math.max(3, longestRun + 1));
      return `# ${entry.label}\n${fence}md\n${text}\n${fence}\n`;
    })
    .join("\n");

export const PromptSettings = () => {
  const entries = usePromptEntries();
  const [selectedId, setSelectedId] = useState(entries[0].id);
  const selected =
    entries.find((entry) => entry.id === selectedId) ?? entries[0];
  return (
    <div className="mb-4 space-y-3">
      <div className="space-y-1">
        <p aria-hidden className="text-sm font-semibold">
          Prompt to edit
        </p>
        <BasicSelect
          isLabelSrOnly
          triggerCN="rounded-lg"
          label="Prompt to edit"
          value={selected.id}
          onChange={setSelectedId}
          options={entries.map((entry) => ({
            value: entry.id,
            label:
              entry.value === undefined
                ? entry.label
                : `${entry.label} (edited)`,
          }))}
        />
      </div>
      {selected.usesSearch && (
        <p className="text-xs text-muted-foreground">
          Uses paid web search. Search calls and model tokens are billed to your
          xAI account.
        </p>
      )}
      <PromptEditor
        key={selected.id}
        title={selected.label}
        value={selected.value}
        defaultValue={selected.defaultValue}
        placeholders={selected.placeholders}
        onChange={selected.onChange}
      />
      <div className="flex justify-center">
        <DownloadMarkdownButton
          markdown={allPromptsMarkdown(entries)}
          filename="kanji-heatmap-ai-prompts.md"
          label="Download all prompts"
        />
      </div>
    </div>
  );
};

export const SpeechSettings = () => {
  const [settings, update] = useAiExplainSettings();
  return (
    <div className="mb-4 space-y-3">
      <div className="space-y-1">
        <p aria-hidden className="text-sm font-semibold">
          Speech voice
        </p>
        <BasicSelect
          isLabelSrOnly
          triggerCN="rounded-lg"
          label="Speech voice"
          value={settings.speechVoice ?? DEFAULT_AI_SPEECH_VOICE}
          onChange={(speechVoice) => update({ speechVoice })}
          options={AI_SPEECH_VOICES.map((voice) => ({
            value: voice,
            label:
              voice[0].toUpperCase() +
              voice.slice(1) +
              (voice === DEFAULT_AI_SPEECH_VOICE ? " (default)" : ""),
          }))}
        />
      </div>
      <div className="space-y-1">
        <p aria-hidden className="text-sm font-semibold">
          MP3 quality
        </p>
        <BasicSelect
          isLabelSrOnly
          triggerCN="rounded-lg"
          label="MP3 quality"
          value={String(settings.speechBitRate ?? DEFAULT_AI_SPEECH_BIT_RATE)}
          onChange={(rate) =>
            update({ speechBitRate: Number(rate) as AiSpeechBitRate })
          }
          options={AI_SPEECH_BIT_RATES.map((rate) => ({
            value: String(rate),
            // 1 kbps is 7.5 KB of audio per minute.
            label: `${rate / 1000} kbps · ~${((rate / 1000) * 0.0075).toFixed(2)} MB per minute${rate === DEFAULT_AI_SPEECH_BIT_RATE ? " (default)" : ""}`,
          }))}
        />
        <p className="text-xs text-muted-foreground">
          Lower is smaller but can sound muffled. Applies to new MP3s.
        </p>
      </div>
      <div className="space-y-1">
        <p aria-hidden className="text-sm font-semibold">
          Speech language
        </p>
        <BasicSelect
          isLabelSrOnly
          triggerCN="rounded-lg"
          label="Speech language"
          value={settings.speechLanguage ?? "auto"}
          onChange={(speechLanguage) =>
            update({ speechLanguage: speechLanguage as "auto" | "ja" })
          }
          options={[
            { value: "auto", label: "Automatic (default)" },
            { value: "ja", label: "Japanese" },
          ]}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Japanese forces Japanese speech mode, even when the text includes
        English. Saved recordings stay playable; use Regenerate MP3 to apply new
        settings.
      </p>
    </div>
  );
};

type StorageStatus =
  | { status: "loading" }
  | { status: "ready"; bytes: number }
  | { status: "confirm"; bytes?: number }
  | { status: "clearing" }
  | { status: "error"; message: string };
const OwnedGeneratedStorage = () => {
  const [state, setState] = useState<StorageStatus>({ status: "loading" });
  // Effect needed: database sizes and clear events come from browser storage, not render-time data or this component's own buttons.
  useEffect(() => {
    let active = true;
    const refresh = () => {
      import("@/lib/ai-explain/storage")
        .then(({ getAiStorageUsage }) => getAiStorageUsage())
        .then(
          (usage) => {
            // Only this user's content: it's what Clear deletes.
            const bytes = Object.values(usage).reduce(
              (sum, kind) => sum + kind.mine,
              0
            );
            if (active)
              setState((previous) =>
                previous.status === "confirm" || previous.status === "clearing"
                  ? previous
                  : { status: "ready", bytes }
              );
          },
          () => {
            if (active)
              setState((previous) =>
                previous.status === "confirm" || previous.status === "clearing"
                  ? previous
                  : {
                      status: "error",
                      message: "Couldn't read generated content storage.",
                    }
              );
          }
        );
    };
    refresh();
    window.addEventListener("ai-generated-content-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("ai-generated-content-changed", refresh);
    };
  }, []);
  const clear = async () => {
    setState({ status: "clearing" });
    try {
      const { clearGeneratedContent } = await import(
        "@/lib/ai-explain/storage"
      );
      await clearGeneratedContent();
      setState({ status: "ready", bytes: 0 });
    } catch {
      setState({
        status: "error",
        message: "Couldn't clear all generated content. Try again.",
      });
    }
  };
  if (state.status === "confirm")
    return (
      <div className="mb-4 space-y-2">
        <p className="text-sm">
          Delete all saved AI text, images, and MP3s from this browser? Download
          anything you want to keep first. Your API key and preferences stay
          saved.
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <TextActionButton
            icon={<Trash2 size={14} />}
            className="text-rose-500"
            onClick={clear}
          >
            Delete generated content
          </TextActionButton>
          <span aria-hidden>·</span>
          <TextActionButton
            onClick={() =>
              setState({ status: "ready", bytes: state.bytes ?? 0 })
            }
          >
            Cancel
          </TextActionButton>
        </div>
      </div>
    );
  return (
    <div className="mb-4 space-y-2">
      <p className="text-sm">
        {state.status === "ready"
          ? `Estimated generated content: ${(state.bytes / 1024 / 1024).toFixed(2)} MB`
          : state.status === "loading"
            ? "Checking saved content…"
            : state.status === "clearing"
              ? "Clearing saved content…"
              : state.message}
      </p>
      <p className="text-xs text-muted-foreground">
        Saved only on this device and browser, and not private: anyone with
        access to this computer can see it. Browser data can be cleared or lost.
        Download content you want to keep.
      </p>
      <TextActionButton
        icon={<Trash2 size={14} />}
        className="text-rose-500"
        busy={state.status === "clearing"}
        busyLabel="Clearing…"
        onClick={() =>
          setState({
            status: "confirm",
            bytes: state.status === "ready" ? state.bytes : undefined,
          })
        }
        disabled={state.status === "loading"}
      >
        Clear generated content
      </TextActionButton>
    </div>
  );
};

/**
 * Remounts for the new owner on login/logout, so a pending "Delete generated
 * content" confirmation can't carry over and delete the other owner's content.
 */
export const GeneratedStorageSettings = () => (
  <OwnedAiContent>
    <OwnedGeneratedStorage />
  </OwnedAiContent>
);
