import { forwardRef, useState, type ComponentProps } from "react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocalStorageFlag } from "@/hooks/use-local-storage";
import { useStorageValue } from "@/hooks/use-storage-value";
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
  preloadFillTheKanjiSet,
  clearFillTheKanjiSetCache,
  fillTheKanjiPreloadKey,
  FILL_THE_KANJI_PRELOAD_KEY_PREFIX,
  hasOutdatedFillTheKanjiDownload,
} from "@/lib/offline-preload";
import { FILL_THE_KANJI_SETS } from "@/lib/fill-the-kanji/sets";
import { approxRowCountLabel } from "@/lib/fill-the-kanji/rounds";
import { DEFAULT_JP_VOICE_ID, findJpVoice, TTS_DISCLAIMER } from "@/lib/tts";
import { cn } from "@/lib/utils";
import { PracticeButton } from "@/components/ui/practice-button";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { SpeakButton } from "@/components/common/SpeakButton";
import { Settings } from "lucide-react";
import { StrokeAnimationSettingsFields } from "@/components/common/StrokeAnimationSettingsFields";
import { useVoiceEngine } from "@/hooks/use-ai-voice";
import { AiVoicePanel, VoiceEngineChoice } from "./AiVoiceSettings";
import { VOICE_PREVIEW_TEXT } from "@/lib/ai-voice/preferences";

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

const countDownloadedFillTheKanjiSets = () =>
  FILL_THE_KANJI_SETS.filter(
    ({ id }) => localStorage.getItem(fillTheKanjiPreloadKey(id)) === "true"
  ).length;

const FillTheKanjiDownloads = () => {
  const downloaded = useStorageValue(
    countDownloadedFillTheKanjiSets,
    (key) => key === null || key.startsWith(FILL_THE_KANJI_PRELOAD_KEY_PREFIX)
  );

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="fill-the-kanji" className="border-b-0">
        <AccordionTrigger className="py-3 text-left hover:no-underline">
          <span className="flex flex-col">
            <span className="text-sm font-semibold">
              Download Fill the Kanji Challenges
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {downloaded}/{FILL_THE_KANJI_SETS.length} challenge sets
              downloaded
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-0 pl-3 border-l-2 border-dotted">
          {FILL_THE_KANJI_SETS.map(({ id, label, sizeHint, unit }) => (
            <DataDownloadRow
              key={id}
              label={label}
              sizeHint={`${
                hasOutdatedFillTheKanjiDownload(id) ? "Update available · " : ""
              }${sizeHint} · ${approxRowCountLabel(id)} ${unit}`}
              completeKey={fillTheKanjiPreloadKey(id)}
              startPreload={(onProgress) =>
                preloadFillTheKanjiSet(id, onProgress)
              }
              clearCache={() => clearFillTheKanjiSetCache(id)}
            />
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const FontGrid = () => {
  const [fontIndex, setFont] = useCurrentFont();

  return (
    <div className="grid grid-cols-5 gap-2">
      {FONT_NAMES.map((name, i) => (
        // Same tiles as the writing-practice / Fill the Kanji kanji pickers.
        <PracticeButton
          key={i}
          size="icon"
          variant={fontIndex === i ? "primary" : "secondary"}
          onClick={() => setFont(i)}
          aria-pressed={fontIndex === i}
          title={name}
          className={cn(
            "flex-col w-full h-auto gap-1 p-2 rounded-xl",
            fontIndex !== i && "border-dashed"
          )}
        >
          <span
            className="text-xl leading-none"
            style={{ fontFamily: `var(--jap-font-${i})` }}
          >
            字体
          </span>
          <span
            className={cn(
              "w-full truncate text-center text-[10px] font-normal tracking-normal",
              fontIndex === i ? "opacity-80" : "text-muted-foreground"
            )}
          >
            {name}
          </span>
        </PracticeButton>
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
    <div className="mx-4 text-left">
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

const JapaneseVoiceSection = () => {
  const [engine] = useVoiceEngine();

  return (
    <SimpleAccordion trigger="Japanese Voice">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-left">
        Voice <SpeakButton word={VOICE_PREVIEW_TEXT} iconType="volume-2" />
      </div>
      <VoiceEngineChoice />
      {engine === "ai" && <AiVoicePanel />}
      <div className="mt-4 mb-2 text-sm font-semibold text-left">
        {engine === "ai"
          ? "Browser voice (used when the AI voice can't play)"
          : "Browser voice"}
      </div>
      <JpVoiceSelect />
    </SimpleAccordion>
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

export const SettingsModalTrigger = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof Button>
>(({ onClick, ...props }, ref) => (
  <Button
    ref={ref}
    variant="outline"
    size="iconXl"
    aria-label="Open User Preferences"
    onClick={onClick}
    {...props}
  >
    <Settings className="w-[1.2rem] h-[1.2rem]" />
  </Button>
));
SettingsModalTrigger.displayName = "SettingsModalTrigger";

export const SettingsModal = ({
  open: openProp,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <SettingsModalTrigger />
        </DialogTrigger>
      )}
      <ScrollableDialogContent
        size="md"
        title="User Preferences"
        description="Presentation, Japanese voice, offline data caching, and stroke animation preferences"
        titleClassName="text-left"
      >
        <SimpleAccordion trigger="Presentation" defaultOpen>
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
            <div className="mx-3">
              <ColorGrid />
            </div>
          </div>

          <LightDarkRow />
        </SimpleAccordion>

        <JapaneseVoiceSection />

        <SimpleAccordion trigger="Data">
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
          <FillTheKanjiDownloads />
        </SimpleAccordion>

        <SimpleAccordion trigger="Stroke Order">
          <p className="mb-3 text-xs text-left text-muted-foreground">
            Used for kanji details, writing practice, and production practice.
          </p>
          <StrokeAnimationSettingsFields />
        </SimpleAccordion>
      </ScrollableDialogContent>
    </Dialog>
  );
};
