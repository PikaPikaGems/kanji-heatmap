import {
  forwardRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/providers/theme-hooks";
import { useCurrentFont } from "@/hooks/use-change-font";
import { useCurrentJpVoice } from "@/hooks/use-jp-voice";
import { useAvailableJpVoices } from "@/hooks/use-available-jp-voices";
import { ColorGrid } from "@/components/common/ColorGrid";
import { DEFAULT_JP_VOICE_ID, findJpVoice } from "@/lib/tts";
import { TtsNotice } from "@/components/dependent/account/TtsNotice";
import { cn } from "@/lib/utils";
import { PracticeButton } from "@/components/ui/practice-button";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { SpeakButton } from "@/components/common/SpeakButton";
import { Settings } from "lucide-react";
import { Loader2 } from "@/components/icons";
import { cnWarningText } from "@/lib/generic-cn";
import { downloadIndonesianMeanings } from "@/providers/indonesian-meanings-hooks";
import { useShowIndonesianMeanings } from "@/hooks/use-show-indonesian-meanings";
import { IndonesianMeaningsCredit } from "@/components/common/IndonesianMeaningsCredit";
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

/** "BIZ UDGothic" → "biz-udgothic", as in scripts/build-font-tiles.mjs. */
const fontTileSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const FontGrid = () => {
  const [fontIndex, setFont] = useCurrentFont();

  return (
    <div className="grid grid-cols-5 gap-2">
      {FONT_NAMES.map((name, i) => (
        // Same tiles as the writing-practice / Fill in the Kanji kanji pickers.
        <PracticeButton
          key={i}
          size="icon"
          variant={fontIndex === i ? "primary" : "secondary"}
          onClick={() => setFont(i)}
          aria-pressed={fontIndex === i}
          title={name}
          className="flex-col w-full h-auto gap-1 p-2 rounded-xl"
        >
          {/* A drawing of 字体 in this font (scripts/build-font-tiles.mjs),
              not live text: live text would download all 15 fonts. The
              mask takes the tile's text color. */}
          <span
            role="img"
            aria-label="字体"
            className="w-10 h-5 bg-current"
            style={{
              mask: `url(/svg/font-tiles/${fontTileSlug(name)}.svg) center / contain no-repeat`,
            }}
          />
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
      {/* Under the choice it explains: what plays, in which order. */}
      <TtsNotice className="mb-5 -mt-2" />
      {engine === "ai" && (
        <div className="animate-fade-in-fast">
          <AiVoicePanel />
        </div>
      )}
      <div
        className={cn(
          "text-left",
          engine === "ai" && "pt-5 mt-6 border-t border-dashed"
        )}
      >
        <div className="mb-2 text-sm font-semibold">
          {engine === "ai" ? "Built-in voice (fallback)" : "Built-in voice"}
        </div>
        <JpVoiceSelect />
      </div>
    </SimpleAccordion>
  );
};

/** A switch with its label, as the Presentation section lists them. */
const SwitchRow = ({
  label,
  children,
  ...switchProps
}: ComponentProps<typeof Switch> & {
  label: string;
  children?: ReactNode;
}) => (
  <div className="flex items-center py-2">
    <Switch {...switchProps} />
    <span className="flex items-center gap-1.5 px-2 text-sm font-semibold">
      {label}
      {children}
    </span>
  </div>
);

const LightDarkRow = () => {
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <SwitchRow
      label="Use Dark mode"
      checked={isDark}
      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      aria-label="Toggle dark mode"
    />
  );
};

/**
 * Turning it on downloads indonesian_meanings.json first; the setting is
 * saved as on only once that worked, and stays off with a warning if not.
 */
const IndonesianMeaningsRow = () => {
  const [showMeanings, setShowMeanings] = useShowIndonesianMeanings();
  const [download, setDownload] = useState<"idle" | "downloading" | "error">(
    "idle"
  );

  const onCheckedChange = (checked: boolean) => {
    if (!checked) {
      setShowMeanings(false);
      setDownload("idle");
      return;
    }
    setDownload("downloading");
    downloadIndonesianMeanings()
      .then(() => {
        setShowMeanings(true);
        setDownload("idle");
      })
      .catch(() => setDownload("error"));
  };

  return (
    <div className="text-left">
      <SwitchRow
        label="Show Indonesian meanings"
        checked={showMeanings}
        disabled={download === "downloading"}
        onCheckedChange={onCheckedChange}
        aria-label="Show Indonesian meanings"
      >
        {download === "downloading" && (
          <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
            <Loader2 className="size-3.5 shrink-0 animate-spin" />
            downloading…
          </span>
        )}
      </SwitchRow>
      {download === "error" && (
        <p className={cn("mb-1 ml-[52px] text-xs", cnWarningText)}>
          Couldn&apos;t download Indonesian meanings. Check your connection and
          try again.
        </p>
      )}
      <p className="ml-[52px] text-xs text-muted-foreground">
        Shown in the kanji details. <IndonesianMeaningsCredit />
      </p>
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
        description="Presentation, Indonesian meanings, Japanese voice and stroke animation preferences"
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
            <ColorGrid />
          </div>

          <LightDarkRow />
          <IndonesianMeaningsRow />
        </SimpleAccordion>

        <JapaneseVoiceSection />

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
