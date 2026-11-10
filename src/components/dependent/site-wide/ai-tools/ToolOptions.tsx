import { Switch } from "@/components/ui/switch";
import BasicSelect from "@/components/common/BasicSelect";
import {
  AI_SPEECH_BIT_RATES,
  DEFAULT_AI_SPEECH_BIT_RATE,
  updateAiToolChoice,
  usesWebSearch,
  type AiSpeechBitRate,
  type ResolvedAiTool,
} from "@/lib/ai-explain/preferences";
import {
  AI_PROVIDERS,
  providerLabel,
  type AiTool,
} from "@/lib/ai-explain/providers/capabilities";
import {
  DEFAULT_VOICES,
  FIXED_VOICES,
} from "@/lib/ai-explain/providers/voices";
import { ElevenLabsVoiceField } from "./ElevenLabsVoiceField";
import { VoiceSample } from "./VoiceSample";

/** A labelled select, the label above it. */
const OptionSelect = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) => (
  <div className="space-y-1">
    <p aria-hidden className="text-sm font-semibold">
      {label}
    </p>
    <BasicSelect
      isLabelSrOnly
      triggerCN="rounded-lg"
      label={label}
      value={value}
      onChange={onChange}
      options={options}
    />
  </div>
);

/** Kanji Essay and Anchor Word Essay can answer from memory instead. */
export const WebSearchField = ({
  tool,
  choice,
}: {
  tool: AiTool;
  choice: ResolvedAiTool;
}) => (
  <div className="space-y-1">
    <div className="flex items-center py-1">
      <Switch
        checked={usesWebSearch(choice)}
        onCheckedChange={(on) =>
          updateAiToolChoice(tool, { webSearch: on ? undefined : false })
        }
        aria-label="Use web search"
      />
      <span className="px-2 text-sm font-semibold">Use web search</span>
    </div>
    <p className="text-xs text-muted-foreground">
      Search finds sources and real-world examples, and is billed per search
      (and its results add many input tokens). Turn it off to have{" "}
      {providerLabel(choice.provider)} answer from memory: cheaper, but with no
      source links and a higher chance of mistakes.
    </p>
  </div>
);

/**
 * Voice, MP3 quality and (xAI) language of Read Aloud. Every provider speaks
 * Japanese by default: xAI in Japanese mode, ElevenLabs with language code
 * "ja", OpenAI and Gemini through the speaking instructions.
 */
export const SpeechOptions = ({ choice }: { choice: ResolvedAiTool }) => {
  const { provider } = choice;
  const takes = AI_PROVIDERS[provider].speech;
  const voices = FIXED_VOICES[provider] ?? [];
  const defaultVoice = DEFAULT_VOICES[provider];
  return (
    <>
      {provider === "elevenlabs" && <ElevenLabsVoiceField choice={choice} />}
      {voices.length > 0 && (
        <OptionSelect
          label="Voice"
          value={choice.voice ?? defaultVoice ?? ""}
          onChange={(voice) => updateAiToolChoice("readAloud", { voice })}
          options={voices.map((voice) => ({
            value: voice.id,
            label: `${voice.name}${voice.id === defaultVoice ? " (default)" : ""}`,
          }))}
        />
      )}
      {voices.length > 0 && <VoiceSample choice={choice} />}
      {takes?.bitRate && (
        <div className="space-y-1">
          <OptionSelect
            label="MP3 quality"
            value={String(choice.bitRate ?? DEFAULT_AI_SPEECH_BIT_RATE)}
            onChange={(rate) =>
              updateAiToolChoice("readAloud", {
                bitRate: Number(rate) as AiSpeechBitRate,
              })
            }
            options={AI_SPEECH_BIT_RATES.map((rate) => ({
              value: String(rate),
              // 1 kbps is 7.5 KB of audio per minute.
              label: `${rate / 1000} kbps · ~${((rate / 1000) * 0.0075).toFixed(2)} MB per minute${rate === DEFAULT_AI_SPEECH_BIT_RATE ? " (default)" : ""}`,
            }))}
          />
          <p className="text-xs text-muted-foreground">
            Lower is smaller but can sound muffled.
          </p>
        </div>
      )}
      {takes?.language && (
        <div className="space-y-1">
          <OptionSelect
            label="Speech language"
            value={choice.language ?? "ja"}
            onChange={(language) =>
              updateAiToolChoice("readAloud", {
                language: language === "auto" ? "auto" : undefined,
              })
            }
            options={[
              { value: "ja", label: "Japanese (default)" },
              { value: "auto", label: "Automatic" },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Japanese reads kanji words in Japanese even inside English text.
          </p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Saved recordings stay playable; use Regenerate MP3 to apply new
        settings.
      </p>
    </>
  );
};

/** Size and quality of Visual Mnemonics, where the provider takes them. */
export const ImageOptions = ({
  choice,
  model,
}: {
  choice: ResolvedAiTool;
  model: string;
}) => {
  const takes = AI_PROVIDERS[choice.provider].image;
  const quality = takes?.qualityModels?.test(model) ?? false;
  return (
    <>
      {takes?.resolution && (
        <OptionSelect
          label="Resolution"
          value={choice.resolution ?? "1k"}
          onChange={(resolution) =>
            updateAiToolChoice("mnemonics", {
              resolution: resolution === "2k" ? "2k" : undefined,
            })
          }
          options={[
            { value: "1k", label: "1K (default)" },
            { value: "2k", label: "2K" },
          ]}
        />
      )}
      {quality && (
        <OptionSelect
          label="Quality"
          value={choice.quality ?? "low"}
          onChange={(next) =>
            updateAiToolChoice("mnemonics", {
              quality: next === "medium" ? "medium" : undefined,
            })
          }
          options={[
            { value: "low", label: "Standard (default)" },
            { value: "medium", label: "Higher detail" },
          ]}
        />
      )}
      <p className="text-xs text-muted-foreground">
        Larger images and higher quality can cost more; see{" "}
        {providerLabel(choice.provider)}&apos;s pricing. Changes apply to future
        images; saved images keep their original settings.
      </p>
    </>
  );
};
