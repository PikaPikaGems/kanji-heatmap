import { useCallback, useEffect, useRef, useState } from "react";
import type { PresetName } from "yomiage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { SpanBadge } from "@/components/ui/badge";
import {
  Copy,
  Download,
  Loader2,
  Play,
  RefreshCw,
  Square,
  Trash2,
} from "@/components/icons";
import {
  useAiVoiceSettings,
  useAiVoiceState,
  useVoiceEngine,
  useYomiageModule,
} from "@/hooks/use-ai-voice";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import type { SpeakStatus } from "@/hooks/use-jp-speak";
import {
  canSpeakAi,
  deleteAiVoiceFiles,
  getAiVoiceDebugReport,
  loadAiVoice,
  retryAiVoice,
  speakAi,
  startAiVoiceIfCached,
  stopAiSpeech,
  unloadAiVoice,
  type AiVoiceState,
} from "@/lib/ai-voice/engine";
import {
  AI_VOICE_PREVIEW_TEXT,
  type AiVoiceSettings,
  type AiVoiceShape,
  type VoiceEngine,
} from "@/lib/ai-voice/preferences";
import sliderHints from "@/lib/ai-voice/yomiage-slider-hints.json";
import { cn } from "@/lib/utils";

type Yomiage = typeof import("yomiage");
type SliderName =
  | keyof AiVoiceShape
  | "speed"
  | "expressiveness"
  | "rhythmVariation";
type SliderSpec = {
  name: SliderName;
  group: "voice" | "delivery";
  label: string;
  step: number;
  hint: string;
};
const SLIDERS = sliderHints.sliders as SliderSpec[];

const chipCn = (selected: boolean) =>
  cn(
    "rounded-xl border-2 px-3 py-1.5 text-sm font-semibold transition-colors",
    selected
      ? "border-theme-color-with-opacity-100 background-theme-color-with-opacity-25"
      : "border-input hover:bg-accent"
  );

const subheadingCn = "mb-2 text-sm font-semibold text-left";

const ENGINE_OPTIONS: { value: VoiceEngine; label: string }[] = [
  { value: "browser", label: "Browser voice" },
  { value: "ai", label: "AI Voice" },
];

export const VoiceEngineChoice = () => {
  const [engine, setEngine] = useVoiceEngine();

  const choose = (next: VoiceEngine) => {
    if (next === engine) return;
    setEngine(next);
    if (next === "ai") {
      // Starts the engine only if the files are already here; never downloads.
      void startAiVoiceIfCached();
    } else {
      stopAiSpeech();
      unloadAiVoice();
    }
  };

  return (
    <div
      className="flex flex-wrap gap-2 mb-3"
      role="group"
      aria-label="Text-to-speech engine"
    >
      {ENGINE_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={engine === value}
          onClick={() => choose(value)}
          className={cn(chipCn(engine === value), "flex items-center gap-2")}
        >
          {label}
          {value === "ai" && (
            <SpanBadge variant="outline" className="px-1.5 py-0 text-[10px]">
              Experimental
            </SpanBadge>
          )}
        </button>
      ))}
    </div>
  );
};

const statusText = (s: AiVoiceState): string => {
  switch (s.status) {
    case "downloading":
      return "Downloading…";
    case "loading":
      return "Loading the voice…";
    case "ready":
      return "Ready";
    case "stopped":
      return "Ready (reloads from this device when used)";
    case "unavailable":
      return s.error ?? "The AI voice isn't available on this device.";
    case "error":
      return s.error ?? "Something went wrong.";
    case "not-loaded":
      if (s.cached === null) return "Checking this device…";
      return s.cached
        ? "Voice files are on this device."
        : "Not downloaded yet. Until then, the browser voice is used.";
  }
};

const AiVoiceFilesRow = ({ state }: { state: AiVoiceState }) => {
  const busy = state.status === "downloading" || state.status === "loading";
  const failed = state.status === "error" || state.status === "unavailable";
  const pct = Math.round((state.progress ?? 0) * 100);
  const size = state.downloadMB != null ? `~${state.downloadMB} MB` : "…";

  return (
    <div className="flex flex-col gap-2 py-3 border-b-2 border-dashed">
      <div className="flex items-center justify-between gap-3 text-left">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Download AI voice</span>
          <span className="text-xs text-muted-foreground">
            {size} · one-time download, stays on this device
          </span>
        </div>
        <div className="flex items-center gap-2">
          {failed && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => void retryAiVoice()}
              aria-label="Retry loading the AI voice"
            >
              <RefreshCw className="size-4" />
            </Button>
          )}
          {state.cached && !busy && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => void deleteAiVoiceFiles()}
              aria-label="Delete AI voice files from this device"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          {!state.cached && !busy && !failed && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => void loadAiVoice()}
              aria-label="Download AI voice"
            >
              <Download className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {busy && (
        <div className="flex items-center gap-2 animate-fade-in">
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
          <Progress value={pct} className="h-2" />
          <span className="w-12 text-xs text-right shrink-0 tabular-nums text-muted-foreground">
            {pct}%
          </span>
        </div>
      )}

      <span
        className={cn(
          "text-xs text-left",
          failed ? "text-destructive" : "text-muted-foreground"
        )}
        role="status"
      >
        {statusText(state)}
      </span>
      {failed && (
        <div>
          <DebugReportButton />
          <p className="text-xs text-muted-foreground">
            If you report this problem, paste the debug report into your
            message. It has device and load details, never what was spoken.
          </p>
        </div>
      )}
    </div>
  );
};

/** Plays the preview sentence with the given settings (AI voice only). */
const usePreview = () => {
  const [status, setStatus] = useState<SpeakStatus>("idle");
  const callRef = useRef(0);

  const play = useCallback((settings: AiVoiceSettings) => {
    // Previews demonstrate the AI voice, so they never fall back to the
    // browser voice: that would sound like the preset.
    if (!canSpeakAi()) return;
    const call = ++callRef.current;
    window.speechSynthesis.cancel();
    setStatus("preparing");
    speakAi(AI_VOICE_PREVIEW_TEXT, {
      settings,
      // The preview's English sentence shows how mixed text is read.
      otherLanguages: "read",
      onStart: () => {
        if (callRef.current === call) setStatus("speaking");
      },
    })
      .catch(() => {
        // The status line explains failures.
      })
      .finally(() => {
        if (callRef.current === call) setStatus("idle");
      });
  }, []);

  const stop = useCallback(() => {
    callRef.current++;
    stopAiSpeech();
    setStatus("idle");
  }, []);

  // Effect needed: stop the preview when User Preferences closes (the dialog
  // unmounts its content).
  useEffect(() => () => stopAiSpeech(), []);

  return { status, play, stop };
};

const formatValue = (v: number) =>
  Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, "");

const VoiceSlider = ({
  spec,
  value,
  range,
  disabled,
  onChange,
}: {
  spec: SliderSpec;
  value: number;
  range: readonly [number, number];
  disabled?: boolean;
  onChange: (v: number) => void;
}) => {
  const [min, max] = range;
  const [expanded, setExpanded] = useState(false);
  const hintId = `ai-voice-${spec.name}-hint`;
  return (
    <div className={cn("py-2 text-left", disabled && "opacity-60")}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm font-semibold">{spec.label}</span>
        <output className="text-xs tabular-nums">{formatValue(value)}</output>
      </div>
      <Slider
        min={min}
        max={max}
        step={spec.step}
        value={[value]}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        thumbLabel={spec.label}
      />
      <p
        id={hintId}
        className={cn(
          "pt-2 text-xs text-muted-foreground",
          !expanded && "line-clamp-1"
        )}
      >
        {spec.hint} Range {min} to {max}.
      </p>
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground"
        aria-expanded={expanded}
        aria-controls={hintId}
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? "See less" : "See more"}
      </button>
    </div>
  );
};

const AiVoiceTuning = ({ mod, ready }: { mod: Yomiage; ready: boolean }) => {
  const [settings, updateSettings] = useAiVoiceSettings();
  const preview = usePreview();
  const { PRESETS, RANGES, DEFAULTS } = mod;
  const presetNames = Object.keys(PRESETS) as PresetName[];

  const choice =
    settings.preset === "custom" ||
    (settings.preset && settings.preset in PRESETS)
      ? settings.preset
      : DEFAULTS.preset;
  const isCustom = choice === "custom";
  const lastPreset: PresetName = choice !== "custom" ? choice : DEFAULTS.preset;
  const shape: AiVoiceShape =
    isCustom && settings.custom ? settings.custom : { ...PRESETS[lastPreset] };

  const delivery = {
    speed: settings.speed ?? DEFAULTS.speed,
    expressiveness: settings.expressiveness ?? DEFAULTS.expressiveness,
    rhythmVariation: settings.rhythmVariation ?? DEFAULTS.rhythmVariation,
  };

  const choosePreset = (next: PresetName | "custom") => {
    const patch: Partial<AiVoiceSettings> = { preset: next };
    // First time on Custom: start from the preset that was selected.
    if (next === "custom" && !settings.custom) {
      patch.custom = { ...PRESETS[lastPreset] };
    }
    preview.play(updateSettings(patch));
  };

  const setValue = (name: SliderName, v: number) => {
    if (name === "pitch" || name === "formant" || name === "breathReduction") {
      updateSettings({ custom: { ...shape, [name]: v } });
    } else {
      updateSettings({ [name]: v });
    }
  };

  const valueOf = (name: SliderName) =>
    name === "pitch" || name === "formant" || name === "breathReduction"
      ? shape[name]
      : delivery[name];

  const sliders = (group: SliderSpec["group"], disabled?: boolean) =>
    SLIDERS.filter((s) => s.group === group).map((spec) => (
      <VoiceSlider
        key={spec.name}
        spec={spec}
        value={valueOf(spec.name)}
        range={RANGES[spec.name]}
        disabled={disabled}
        onChange={(v) => setValue(spec.name, v)}
      />
    ));

  const previewing = preview.status !== "idle";

  return (
    <div className="pt-3">
      <span className={cn(subheadingCn, "block")}>Preset</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Preset">
        {[...presetNames, "custom" as const].map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={choice === name}
            onClick={() => choosePreset(name)}
            className={chipCn(choice === name)}
          >
            {name === "custom" ? "Custom" : name}
          </button>
        ))}
      </div>
      {!ready && (
        <p className="pt-2 text-xs text-left text-muted-foreground">
          Download the AI voice to hear presets.
        </p>
      )}

      <div className="flex items-center gap-2 py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!ready}
          onClick={() =>
            preview.play({
              ...settings,
              preset: choice,
            })
          }
          aria-busy={preview.status === "preparing"}
        >
          {preview.status === "preparing" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Play />
          )}
          Test Voice
        </Button>
        {previewing && (
          <Button variant="ghost" size="sm" onClick={preview.stop}>
            <Square />
            Stop
          </Button>
        )}
      </div>

      <span className={cn(subheadingCn, "block mt-2")}>Voice</span>
      {!isCustom && (
        <p className="text-xs text-left text-muted-foreground">
          Set by the preset. Select Custom to change these.
        </p>
      )}
      {sliders("voice", !isCustom)}

      <span className={cn(subheadingCn, "block mt-4")}>Delivery</span>
      {sliders("delivery")}
    </div>
  );
};

const DebugReportButton = () => {
  const { copy, status } = useCopyToClipboard(1500);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async (e) => {
        const report = await getAiVoiceDebugReport();
        void copy(report, e);
      }}
    >
      <Copy />
      {status === "copied" ? "Copied" : "Copy debug report"}
    </Button>
  );
};

/** Everything shown under "AI Voice" in User Preferences. */
export const AiVoicePanel = () => {
  const state = useAiVoiceState();
  const mod = useYomiageModule();

  // Effect needed: reads (without downloading) whether the voice files are
  // already on this device, for the download row.
  useEffect(() => {
    void startAiVoiceIfCached();
  }, []);

  const ready = state.status === "ready" || state.status === "stopped";

  return (
    <div className="text-left">
      <p className="p-3 mb-1 text-xs border-2 border-dashed rounded-lg text-muted-foreground">
        ⚠️ Experimental. The AI voice runs on your device: it needs a one-time
        download (size below) and uses a few hundred MB of memory while
        it&apos;s loaded. It may not work on every device or browser. Whenever
        it can&apos;t play, your browser voice is used instead.
      </p>

      <AiVoiceFilesRow state={state} />

      {mod && <AiVoiceTuning mod={mod} ready={ready} />}

      {mod && (
        <p className="pt-2 text-xs text-muted-foreground">{mod.CREDIT}</p>
      )}
    </div>
  );
};
