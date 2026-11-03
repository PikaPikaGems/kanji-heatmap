import { forwardRef, useState, type ComponentProps } from "react";
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
import { StrokeAnimationSettingsFields } from "@/components/common/StrokeAnimationSettingsFields";
import { useVoiceEngine } from "@/hooks/use-ai-voice";
import { AiVoicePanel, VoiceEngineChoice } from "./AiVoiceSettings";
import { AiExplainSection } from "./AiExplainSettings";
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
    <div className="mx-1 text-left">
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
      <TtsNotice className="pt-2" />
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
        description="Presentation, Japanese voice, offline data caching, stroke animation, and AI Study Tools preferences"
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
        </SimpleAccordion>

        <JapaneseVoiceSection />

        <SimpleAccordion trigger="Stroke Order">
          <p className="mb-3 text-xs text-left text-muted-foreground">
            Used for kanji details, writing practice, and production practice.
          </p>
          <StrokeAnimationSettingsFields />
        </SimpleAccordion>

        <AiExplainSection />
      </ScrollableDialogContent>
    </Dialog>
  );
};
