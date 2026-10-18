import { RotateCcw } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PresetName } from "yomiage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SpanBadge } from "@/components/ui/badge";
import { ErrorTerminal } from "@/components/common/ErrorTerminal";
import {
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
  DELIVERY_PRESETS,
  deliveryPresetOf,
  FLAT_DELIVERY,
  VOICE_PREVIEW_TEXT,
  type AiVoiceSettings,
  type DeliveryPreset,
  type AiVoiceShape,
  type VoiceEngine,
} from "@/lib/ai-voice/preferences";
import sliderHints from "@/lib/ai-voice/yomiage-slider-hints.json";
import { cn } from "@/lib/utils";
import { PracticeButton } from "@/components/ui/practice-button";

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
      className="grid grid-cols-2 gap-2 mb-3"
      role="group"
      aria-label="Text-to-speech engine"
    >
      {ENGINE_OPTIONS.map(({ value, label }) => (
        // Same tiles as the presets and the kanji pickers in the games.
        <PracticeButton
          key={value}
          variant={engine === value ? "primary" : "secondary"}
          aria-pressed={engine === value}
          onClick={() => choose(value)}
          className={cn(
            "w-full h-auto px-2 py-2 text-sm rounded-xl",
            engine !== value && "border-dotted"
          )}
        >
          {label}
          {value === "ai" && (
            <SpanBadge
              variant="outline"
              className={cn(
                "px-1.5 py-0 text-[10px]",
                // Matches the tile: white on the filled selected tile, the
                // secondary tile's border color otherwise.
                engine === value
                  ? "border-white/70 text-white"
                  : "border-foreground/30"
              )}
            >
              Experimental
            </SpanBadge>
          )}
        </PracticeButton>
      ))}
    </div>
  );
};

const statusText = (s: AiVoiceState): string | null => {
  if (s.status === "downloading") {
    return "Downloading…";
  }
  if (s.status === "loading") {
    return "Loading the voice…";
  }
  if (s.status === "ready") {
    return "Ready";
  }
  if (s.status === "stopped") {
    return "Ready (reloads from this device when used)";
  }
  if (s.status === "unavailable") {
    return s.error ?? "The AI voice isn't available on this device.";
  }
  if (s.status === "error") {
    return s.error ?? "Something went wrong.";
  }
  // "not-loaded"
  if (s.cached === null) return "Checking this device…";
  // Downloaded: the "Downloaded" line below says so.
  return s.cached
    ? null
    : "Not downloaded yet. Until then, the browser voice is used.";
};

const AiVoiceFilesRow = ({ state }: { state: AiVoiceState }) => {
  const busy = state.status === "downloading" || state.status === "loading";
  const failed = state.status === "error" || state.status === "unavailable";
  const pct = Math.round((state.progress ?? 0) * 100);
  const size = state.downloadMB != null ? `~${state.downloadMB} MB` : "…";
  const status = statusText(state);
  const needsDownload = state.status === "not-loaded" && state.cached === false;

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

      {/* Same line as the data downloads in User Preferences. */}
      {state.cached && !busy && (
        <span className="flex items-center gap-1 text-xs font-medium text-theme-color-with-opacity-100 animate-fade-in">
          <Download className="size-3.5" />
          Downloaded and cached for offline use
        </span>
      )}
      {status && (
        <span
          className={cn(
            "text-xs text-left",
            failed && "text-destructive",
            needsDownload && "font-bold text-yellow-600 dark:text-yellow-500",
            !failed && !needsDownload && "text-muted-foreground"
          )}
          role="status"
        >
          {status}
        </span>
      )}
      {!failed && state.speakError && (
        <span className="text-xs text-left text-destructive" role="status">
          Last time the AI voice couldn&apos;t play: {state.speakError}
        </span>
      )}
      {(failed || state.speakError) && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            If you report this problem, copy the debug report below into your
            message. It has device and load details, never what was spoken.
          </p>
          {/* Keyed so a new error fetches a fresh report. */}
          <DebugReportTerminal
            key={state.error ?? state.speakError ?? state.status}
          />
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
    speakAi(VOICE_PREVIEW_TEXT, {
      settings,
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
  onChange,
}: {
  spec: SliderSpec;
  value: number;
  range: readonly [number, number];
  onChange: (v: number) => void;
}) => {
  const [min, max] = range;
  const [expanded, setExpanded] = useState(false);
  const hintId = `ai-voice-${spec.name}-hint`;
  return (
    <div className="py-2 text-left">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm font-semibold">{spec.label}</span>
        <output className="text-xs tabular-nums">{formatValue(value)}</output>
      </div>
      <Slider
        min={min}
        max={max}
        step={spec.step}
        value={[value]}
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

/** A row of preset tiles, the same as the writing-practice / Fill in the Kanji kanji pickers. */
const PresetTiles = <T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: readonly T[];
  selected: T;
  onSelect: (next: T) => void;
}) => (
  // Rows of 3 so Custom isn't left alone on its own row.
  <div className="grid grid-cols-3 gap-2" role="group" aria-label={label}>
    {options.map((name) => (
      <PracticeButton
        key={name}
        variant={selected === name ? "primary" : "secondary"}
        aria-pressed={selected === name}
        onClick={() => onSelect(name)}
        className={cn(
          "w-full h-auto px-2 py-2 text-sm capitalize rounded-xl",
          selected !== name && "border-dotted"
        )}
      >
        {name}
      </PracticeButton>
    ))}
  </div>
);

/** The Custom sliders under a preset row; open until the user folds it. */
const CustomizationSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Accordion type="single" collapsible defaultValue="open" className="mt-3">
    <AccordionItem value="open" className="border-b-0">
      <AccordionTrigger className="justify-start gap-2 py-1 text-sm font-semibold text-left">
        {title}
      </AccordionTrigger>
      <AccordionContent className="pb-0">{children}</AccordionContent>
    </AccordionItem>
  </Accordion>
);

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

  const deliveryChoice = deliveryPresetOf(settings);
  const delivery = {
    speed: settings.speed ?? DEFAULTS.speed,
    expressiveness: settings.expressiveness ?? DEFAULTS.expressiveness,
    rhythmVariation: settings.rhythmVariation ?? DEFAULTS.rhythmVariation,
  };

  const choosePreset = (next: PresetName | "custom") => {
    const patch: Partial<AiVoiceSettings> = { preset: next };
    // Custom starts from the preset it was switched from, like Delivery.
    if (next === "custom" && !isCustom) {
      patch.custom = { ...PRESETS[lastPreset] };
    }
    preview.play(updateSettings(patch));
  };

  const chooseDelivery = (next: DeliveryPreset) => {
    const patch: Partial<AiVoiceSettings> = { deliveryPreset: next };
    // Custom starts from the preset it was switched from. Unset fields mean
    // yomiage's defaults, which is Default's values.
    if (next === "custom" && deliveryChoice === "flat") {
      Object.assign(patch, FLAT_DELIVERY);
    }
    if (next === "custom" && deliveryChoice === "default") {
      Object.assign(patch, {
        speed: undefined,
        expressiveness: undefined,
        rhythmVariation: undefined,
      });
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

  const sliders = (group: SliderSpec["group"]) =>
    SLIDERS.filter((s) => s.group === group).map((spec) => (
      <VoiceSlider
        key={spec.name}
        spec={spec}
        value={valueOf(spec.name)}
        range={RANGES[spec.name]}
        onChange={(v) => setValue(spec.name, v)}
      />
    ));

  const previewing = preview.status !== "idle";

  return (
    <div className="pt-3">
      {/* Becomes Stop while the preview plays. */}
      <div className="pb-3">
        {previewing ? (
          <PracticeButton
            variant="secondary"
            size="md"
            className="h-10"
            onClick={preview.stop}
            aria-busy={preview.status === "preparing"}
          >
            {preview.status === "preparing" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Square />
            )}
            Stop
          </PracticeButton>
        ) : (
          <PracticeButton
            variant="secondary"
            size="md"
            className="h-10"
            disabled={!ready}
            onClick={() =>
              preview.play({
                ...settings,
                preset: choice,
                deliveryPreset: deliveryChoice,
              })
            }
          >
            <Play />
            Test Voice
          </PracticeButton>
        )}
      </div>
      <span className={cn(subheadingCn, "block")}>Voice Presets</span>
      <PresetTiles
        label="Voice Presets"
        options={[...presetNames, "custom" as const]}
        selected={choice}
        onSelect={choosePreset}
      />
      {!ready && (
        <p className="pt-2 text-xs text-left text-muted-foreground">
          Presets can be heard once the voice has loaded.
        </p>
      )}
      {isCustom && (
        <CustomizationSection title="Voice Customization">
          {sliders("voice")}
        </CustomizationSection>
      )}

      <span className={cn(subheadingCn, "block mt-4")}>Delivery Presets</span>
      <PresetTiles
        label="Delivery Presets"
        options={DELIVERY_PRESETS}
        selected={deliveryChoice}
        onSelect={chooseDelivery}
      />
      {deliveryChoice === "custom" && (
        <CustomizationSection title="Delivery Customization">
          {sliders("delivery")}
          {/* Unset fields mean yomiage's defaults. */}
          <TextActionButton
            className="flex mx-auto mt-2"
            icon={<RotateCcw size={14} />}
            disabled={
              settings.speed === undefined &&
              settings.expressiveness === undefined &&
              settings.rhythmVariation === undefined
            }
            onClick={() =>
              updateSettings({
                speed: undefined,
                expressiveness: undefined,
                rhythmVariation: undefined,
              })
            }
          >
            Reset to defaults
          </TextActionButton>
        </CustomizationSection>
      )}
    </div>
  );
};

/**
 * The debug report on screen, terminal style, with its own copy button.
 * Copying straight after fetching the report (the old button) silently
 * failed on iOS: Safari only allows clipboard writes right inside the tap,
 * and the await in between ended that. Shown text can also be selected.
 */
const DebugReportTerminal = () => {
  const [report, setReport] = useState<string | null>(null);

  // Effect needed: the report is async (it asks the yomiage worker), and it
  // must be ready before the copy tap so the copy happens inside the tap.
  useEffect(() => {
    let cancelled = false;
    void getAiVoiceDebugReport()
      .catch((err: unknown) => `Debug report failed: ${String(err)}`)
      .then((text) => {
        if (!cancelled) setReport(text);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ErrorTerminal
      content={report ?? "Collecting debug report…"}
      filename="ai-voice.log"
    />
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
      <AiVoiceFilesRow state={state} />

      <p className="p-3 mb-1 text-xs border-2 border-dashed rounded-lg text-muted-foreground">
        ⚠️ Experimental. The AI voice runs on your device: it needs a one-time
        download (size above) and uses a few hundred MB of memory while
        it&apos;s loaded. It may not work on every device or browser. Whenever
        it can&apos;t play, your browser voice is used instead.
      </p>

      {/* Presets and sliders only matter once the voice is downloaded. */}
      {mod && state.cached && <AiVoiceTuning mod={mod} ready={ready} />}

      {mod && (
        <p className="pt-2 text-xs text-muted-foreground">{mod.CREDIT}</p>
      )}
    </div>
  );
};
