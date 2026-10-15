import { useEffect, useId, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudyNotesTextarea } from "@/components/common/StudyNotesTextarea";
import { ResponsiveSelect } from "@/components/common/ResponsiveSelect";
import {
  AI_SPEECH_VOICES,
  DEFAULT_AI_SPEECH_VOICE,
} from "@/lib/ai-explain/preferences";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import {
  DEFAULT_AI_IMAGE_MODEL,
  DEFAULT_VOCABULARY_PROMPT,
  DEFAULT_KANJI_ESSAY_PROMPT,
  DEFAULT_IMAGE_PROMPT,
  DEFAULT_IMAGE_STYLE_PROMPTS,
  DEFAULT_IMAGE_PALETTE_PROMPT,
  type ImageStyle,
} from "@/lib/ai-explain/prompts";

type PromptEditorProps = {
  title: string;
  value?: string;
  defaultValue: string;
  placeholders: string;
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
          onClick={() => onChange(undefined)}
          disabled={value === undefined}
        >
          <RotateCcw /> Reset to default
        </Button>
      </div>
      <StudyNotesTextarea
        id={id}
        rows={7}
        value={value ?? defaultValue}
        onChange={(event) =>
          onChange(
            event.target.value === defaultValue ? undefined : event.target.value
          )
        }
        spellCheck={false}
      />
      <p className="text-xs text-muted-foreground">
        Placeholders: {placeholders}
      </p>
    </div>
  );
};

const SearchUsageNotice = () => (
  <p className="mb-3 text-xs text-muted-foreground">
    Uses paid web search. Search calls and model tokens are billed to your xAI
    account.
  </p>
);

export const VocabularyPromptSettings = () => {
  const [settings, update] = useAiExplainSettings();
  return (
    <>
      <SearchUsageNotice />
      <PromptEditor
        title="Vocabulary details prompt"
        value={settings.vocabularyPrompt}
        defaultValue={DEFAULT_VOCABULARY_PROMPT}
        placeholders="{WORD}, {READING}, {DICTIONARY_CONTEXT}"
        onChange={(vocabularyPrompt) => update({ vocabularyPrompt })}
      />
    </>
  );
};

export const KanjiEssayPromptSettings = () => {
  const [settings, update] = useAiExplainSettings();
  return (
    <>
      <SearchUsageNotice />
      <PromptEditor
        title="Kanji essay prompt"
        value={settings.kanjiEssayPrompt}
        defaultValue={DEFAULT_KANJI_ESSAY_PROMPT}
        placeholders="{KANJI}, {KANJI_CONTEXT}"
        onChange={(kanjiEssayPrompt) => update({ kanjiEssayPrompt })}
      />
    </>
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
        id={`${id}-model`}
        value={settings.imageModel ?? ""}
        placeholder={DEFAULT_AI_IMAGE_MODEL}
        onChange={(event) =>
          update({ imageModel: event.target.value.trim() || undefined })
        }
      />
      <label
        className="block text-sm font-semibold"
        htmlFor={`${id}-resolution`}
      >
        Resolution
      </label>
      <select
        id={`${id}-resolution`}
        className="w-full p-2 border rounded-lg bg-background"
        value={settings.imageResolution ?? "1k"}
        onChange={(event) =>
          update({ imageResolution: event.target.value as "1k" | "2k" })
        }
      >
        <option value="1k">1K (default)</option>
        <option value="2k">2K</option>
      </select>
      {supportsQuality && (
        <>
          <label
            className="block text-sm font-semibold"
            htmlFor={`${id}-quality`}
          >
            Quality
          </label>
          <select
            id={`${id}-quality`}
            className="w-full p-2 border rounded-lg bg-background"
            value={settings.imageQuality ?? "low"}
            onChange={(event) =>
              update({ imageQuality: event.target.value as "low" | "medium" })
            }
          >
            <option value="low">Standard (default)</option>
            <option value="medium">Higher detail</option>
          </select>
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

const styleLabels: Record<ImageStyle, string> = {
  "kanji-heatmap": "Kanji Heatmap",
  watercolor: "Watercolor",
  "pixel-art": "16-bit game art",
  cartoon: "Cartoon / anime",
  custom: "Custom",
};
export const ImageSettings = () => {
  const [settings, update] = useAiExplainSettings();
  return (
    <>
      <ImageGenerationSettings />
      <PromptEditor
        title="Shared image prompt"
        value={settings.imagePrompt}
        defaultValue={DEFAULT_IMAGE_PROMPT}
        placeholders="{KANJI}, {KEYWORD}, {DESCRIPTION}, {STYLE_PROMPT}, {PALETTE_PROMPT}"
        onChange={(imagePrompt) => update({ imagePrompt })}
      />
      {(Object.keys(styleLabels) as ImageStyle[]).map((style) => (
        <PromptEditor
          key={style}
          title={`${styleLabels[style]} style prompt`}
          value={settings.imageStylePrompts?.[style]}
          defaultValue={DEFAULT_IMAGE_STYLE_PROMPTS[style]}
          placeholders="No placeholders"
          onChange={(value) =>
            update({
              imageStylePrompts: {
                ...settings.imageStylePrompts,
                [style]: value,
              },
            })
          }
        />
      ))}
      <PromptEditor
        title="Kanji Heatmap palette prompt"
        value={settings.imagePalettePrompt}
        defaultValue={DEFAULT_IMAGE_PALETTE_PROMPT}
        placeholders="No placeholders"
        onChange={(imagePalettePrompt) => update({ imagePalettePrompt })}
      />
    </>
  );
};

export const SpeechSettings = () => {
  const [settings, update] = useAiExplainSettings();
  return (
    <div className="mb-4 space-y-3">
      <ResponsiveSelect
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
      <ResponsiveSelect
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
export const GeneratedStorageSettings = () => {
  const [state, setState] = useState<StorageStatus>({ status: "loading" });
  // Effect needed: database sizes and clear events come from browser storage, not render-time data or this component's own buttons.
  useEffect(() => {
    let active = true;
    const refresh = () => {
      import("@/lib/ai-explain/storage")
        .then(({ getGeneratedContentSize }) => getGeneratedContentSize())
        .then(
          (bytes) => {
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
        <div className="flex gap-2">
          <Button variant="destructive" onClick={clear}>
            Delete generated content
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setState({ status: "ready", bytes: state.bytes ?? 0 })
            }
          >
            Cancel
          </Button>
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
        Saved only on this device and browser. Browser data can be cleared or
        lost. Download content you want to keep.
      </p>
      <Button
        variant="outline"
        onClick={() =>
          setState({
            status: "confirm",
            bytes: state.status === "ready" ? state.bytes : undefined,
          })
        }
        disabled={state.status === "loading" || state.status === "clearing"}
      >
        Clear generated content
      </Button>
    </div>
  );
};
