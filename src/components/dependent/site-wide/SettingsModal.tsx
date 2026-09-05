import { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Download, Loader2, CircleX } from "@/components/icons";
import { useLocalStorageFlag } from "@/hooks/use-local-storage";
import { useTheme } from "@/providers/theme-hooks";
import { useCurrentFont } from "@/hooks/use-change-font";
import { useCurrentJpVoice } from "@/hooks/use-jp-voice";
import { useAvailableJpVoices } from "@/hooks/use-available-jp-voices";
import { ColorGrid } from "@/components/common/ColorGrid";
import {
  preloadKanjiSvgs,
  preloadKatakanaChallenges,
  clearKanjiSvgCache,
  clearKatakanaCache,
} from "@/lib/offline-preload";
import { DEFAULT_JP_VOICE_ID, findJpVoice, TTS_DISCLAIMER } from "@/lib/tts";
import { cn } from "@/lib/utils";
import { SpeakButton } from "@/components/common/SpeakButton";
import { Settings } from "lucide-react";
import { StrokeAnimationSettingsFields } from "@/components/common/StrokeAnimationSettingsFields";

// Names line up with the active `:root` block in src/JFonts.css (jap-font-0..14).
const FONT_NAMES = [
  "BIZ UDGothic",
  "Noto Sans JP",
  "Noto Serif JP",
  "Zen Old Mincho",
  "Yuji Boku",
  "Yuji Mai",
  "Klee One",
  "Kiwi Maru",
  "Hachi Maru Pop",
  "DotGothic16",
  "Reggae One",
  "Zen Kurenaido",
  "Stick",
  "Yusei Magic",
  "Potta One",
];

const sectionHeadingCn =
  "mb-3 mt-6 border-b-2 border-dotted text-xs font-extrabold uppercase tracking-widest text-muted-foreground text-left";

type PreloadProgress = { done: number; total: number } | null;
type CancelFn = () => void;

const DataDownloadRow = ({
  label,
  sizeHint,
  completeKey,
  startPreload,
  clearCache,
}: {
  label: string;
  sizeHint: string;
  completeKey: string;
  startPreload: (onProgress: (done: number, total: number) => void) => {
    promise: Promise<void>;
    cancel: CancelFn;
  };
  clearCache: () => Promise<void>;
}) => {
  const [complete, setComplete] = useLocalStorageFlag(completeKey);
  const [progress, setProgress] = useState<PreloadProgress>(null);
  const [cancelFn, setCancelFn] = useState<CancelFn | null>(null);

  const isRunning = progress !== null && !complete;

  const handleDownload = () => {
    if (complete || isRunning) return;

    setProgress({ done: 0, total: 0 });
    const { promise, cancel } = startPreload((done, total) =>
      setProgress({ done, total })
    );

    let cancelled = false;
    setCancelFn(() => () => {
      cancelled = true;
      cancel();
    });
    promise.then(() => {
      if (cancelled) return;
      setComplete(true);
      setProgress(null);
      setCancelFn(null);
    });
  };

  const handleCancel = () => {
    cancelFn?.();
    setCancelFn(null);
    setProgress(null);
  };

  const handleClear = async () => {
    cancelFn?.();
    setCancelFn(null);
    setProgress(null);
    setComplete(false);
    await clearCache();
  };

  const pct =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-2 py-3 border-b-2 border-dashed last:border-b-0">
      <div className="flex items-center justify-between gap-3 text-left">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground">{sizeHint}</span>
        </div>
        <div className="flex items-center gap-2">
          {complete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={handleClear}
              aria-label={`Clear ${label} cache`}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          {!complete &&
            (isRunning ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={handleCancel}
                aria-label={`Cancel ${label}`}
              >
                <CircleX className="size-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={handleDownload}
                aria-label={label}
              >
                <Download className="size-4" />
              </Button>
            ))}
        </div>
      </div>

      {isRunning && (
        <div className="flex items-center gap-2 animate-fade-in">
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
          <Progress value={pct} className="h-2" />
          <span className="w-16 text-xs text-right shrink-0 tabular-nums text-muted-foreground ">
            {progress && progress.total > 0
              ? `${progress.done}/${progress.total}`
              : "…"}
          </span>
        </div>
      )}

      {complete && !isRunning && (
        <span className="flex items-center gap-1 text-xs font-medium text-theme-color-with-opacity-100 animate-fade-in">
          <Download className="size-3.5" />
          Downloaded and cached for offline use
        </span>
      )}
    </div>
  );
};

const FontGrid = () => {
  const [fontIndex, setFont] = useCurrentFont();

  return (
    <div className="grid grid-cols-5 gap-2">
      {FONT_NAMES.map((name, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setFont(i)}
          aria-pressed={fontIndex === i}
          title={name}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 transition-colors",
            fontIndex === i
              ? "border-theme-color-with-opacity-100 background-theme-color-with-opacity-25"
              : "border-input hover:bg-accent"
          )}
        >
          <span
            className="text-xl leading-none"
            style={{ fontFamily: `var(--jap-font-${i})` }}
          >
            字体
          </span>
          <span className="w-full truncate text-center text-[10px] text-muted-foreground">
            {name}
          </span>
        </button>
      ))}
    </div>
  );
};

const JpVoiceSelect = () => {
  const [voiceId, setVoiceId] = useCurrentJpVoice();
  const availableVoices = useAvailableJpVoices();

  // Prefer an exact voiceURI match for the select value; legacy short ids
  // (e.g. "kyoko") map to the matching installed voice when possible.
  const matched = findJpVoice(availableVoices, voiceId);
  const selectValue = matched?.voiceURI ?? DEFAULT_JP_VOICE_ID;

  return (
    <div className="text-left">
      <Select value={selectValue} onValueChange={setVoiceId}>
        <SelectTrigger aria-label="Japanese text-to-speech voice">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_JP_VOICE_ID}>Default</SelectItem>
          {availableVoices.map((voice) => (
            <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="pt-2 text-xs text-muted-foreground">{TTS_DISCLAIMER}</p>
    </div>
  );
};

const LightDarkRow = () => {
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="flex items-center py-2">
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />

      <span className="px-2 text-sm font-semibold">Use Dark mode</span>
    </div>
  );
};

export const SettingsModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="iconXl"
          aria-label="Open User Preferences"
          className="ml-1"
        >
          <Settings className="w-[1.2rem] h-[1.2rem]" />
        </Button>
      </DialogTrigger>
      <ScrollableDialogContent
        size="md"
        title="User Preferences"
        description="Offline data caching, stroke animation, and presentation preferences"
        titleClassName="text-left"
      >
        <section>
          <h3 className={sectionHeadingCn}>Data</h3>
          <DataDownloadRow
            label="Download Kanji SVGs"
            sizeHint="~16 MB · stroke order for ~2000 kanji"
            completeKey="svg-preload-complete"
            startPreload={preloadKanjiSvgs}
            clearCache={clearKanjiSvgCache}
          />
          <DataDownloadRow
            label="Download Katakana Challenges"
            sizeHint="~1 MB · 10,000 speed katakana words"
            completeKey="katakana-preload-complete"
            startPreload={preloadKatakanaChallenges}
            clearCache={clearKatakanaCache}
          />
        </section>

        <section className="mt-6">
          <h3 className={sectionHeadingCn}>Presentation</h3>

          <div className="mb-4 text-left">
            <span className="block mb-2 text-sm font-semibold">
              Japanese Font
            </span>
            <FontGrid />
          </div>

          <div className="mb-4 text-left">
            <span className="block mb-2 text-sm font-semibold">
              Theme Color
            </span>
            <ColorGrid />
          </div>

          <div className="mb-4 text-left">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              Japanese Voice{" "}
              <SpeakButton word={"こんにちは"} iconType="volume-2" />
            </div>
            <JpVoiceSelect />
          </div>

          <LightDarkRow />

          <section className="mt-6">
            <h3 className={sectionHeadingCn}>Stroke order</h3>
            <p className="mb-3 text-xs text-left text-muted-foreground">
              Used for kanji details, writing practice, and production practice.
            </p>
            <StrokeAnimationSettingsFields />
          </section>
        </section>
      </ScrollableDialogContent>
    </Dialog>
  );
};
