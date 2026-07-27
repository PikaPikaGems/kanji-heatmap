import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Settings2, Trash2, Download, Loader2 } from "@/components/icons";
import { useLocalStorageFlag } from "@/hooks/use-local-storage";
import { useTheme } from "@/providers/theme-hooks";
import { useCurrentFont } from "@/hooks/use-change-font";
import {
  useCurrentThemeColor,
  themeColorsRgb,
} from "@/hooks/use-change-theme-color";
import {
  preloadKanjiSvgs,
  preloadKatakanaChallenges,
  clearKanjiSvgCache,
  clearKatakanaCache,
} from "@/lib/offline-preload";
import { cn } from "@/lib/utils";

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
  "mb-3 pb-1.5 border-b-2 border-dotted text-xs font-extrabold uppercase tracking-widest text-muted-foreground";

type PreloadProgress = { done: number; total: number } | null;
type CancelFn = () => void;

const DataDownloadRow = ({
  label,
  sizeHint,
  enabledKey,
  completeKey,
  startPreload,
  clearCache,
}: {
  label: string;
  sizeHint: string;
  enabledKey: string;
  completeKey: string;
  startPreload: (onProgress: (done: number, total: number) => void) => {
    promise: Promise<void>;
    cancel: CancelFn;
  };
  clearCache: () => Promise<void>;
}) => {
  const [enabled, setEnabled] = useLocalStorageFlag(enabledKey);
  const [complete, setComplete] = useLocalStorageFlag(completeKey);
  const [progress, setProgress] = useState<PreloadProgress>(null);
  const [cancelFn, setCancelFn] = useState<CancelFn | null>(null);

  const isRunning = progress !== null && !complete;

  const handleToggle = (next: boolean) => {
    setEnabled(next);

    if (!next) {
      cancelFn?.();
      setCancelFn(null);
      setProgress(null);
      return;
    }

    if (complete) return;

    setProgress({ done: 0, total: 0 });
    const { promise, cancel } = startPreload((done, total) =>
      setProgress({ done, total })
    );
    setCancelFn(() => cancel);
    promise.then(() => {
      setComplete(true);
      setProgress(null);
      setCancelFn(null);
    });
  };

  const handleClear = async () => {
    cancelFn?.();
    setCancelFn(null);
    setProgress(null);
    setEnabled(false);
    setComplete(false);
    await clearCache();
  };

  const pct =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-2 py-3 border-b-2 border-dashed last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground">{sizeHint}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={handleClear}
            aria-label={`Clear ${label} cache`}
          >
            <Trash2 className="size-4" />
          </Button>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            aria-label={`Toggle ${label}`}
          />
        </div>
      </div>

      {isRunning && (
        <div className="flex items-center gap-2">
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
          <Progress value={pct} className="h-2" />
          <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {progress && progress.total > 0
              ? `${progress.done}/${progress.total}`
              : "…"}
          </span>
        </div>
      )}

      {complete && !isRunning && (
        <span className="flex items-center gap-1 text-xs font-medium text-theme-color-with-opacity-100">
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
            className="text-2xl leading-none"
            style={{ fontFamily: `var(--jap-font-${i})` }}
          >
            字
          </span>
          <span className="w-full truncate text-center text-[10px] text-muted-foreground">
            {name}
          </span>
        </button>
      ))}
    </div>
  );
};

const ColorGrid = () => {
  const [colorIndex, setThemeColor] = useCurrentThemeColor();

  return (
    <div className="grid grid-cols-6 gap-2">
      {themeColorsRgb.map((rgb, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setThemeColor(i)}
          aria-pressed={colorIndex === i}
          aria-label={`Theme color ${i + 1}`}
          className={cn(
            "aspect-square rounded-xl border-2 transition-transform",
            colorIndex === i
              ? "border-theme-color-darker scale-95 ring-2 ring-offset-2 ring-offset-background"
              : "border-transparent hover:scale-105"
          )}
          style={{
            backgroundColor: `rgb(${rgb})`,
            ...(colorIndex === i ? { borderColor: `rgb(${rgb})` } : {}),
          }}
        />
      ))}
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
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-semibold">
        {isDark ? "🌙 Dark mode" : "🔆 Light mode"}
      </span>
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
    </div>
  );
};

export const SettingsModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="iconXl" aria-label="Open settings">
          <Settings2 className="w-[1.2rem] h-[1.2rem]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Offline data caching and presentation preferences
          </DialogDescription>
        </DialogHeader>

        <section>
          <h3 className={sectionHeadingCn}>Data</h3>
          <DataDownloadRow
            label="Download All Kanji SVGs"
            sizeHint="~16 MB · stroke order for every kanji"
            enabledKey="svg-preload-enabled"
            completeKey="svg-preload-complete"
            startPreload={preloadKanjiSvgs}
            clearCache={clearKanjiSvgCache}
          />
          <DataDownloadRow
            label="Download All Katakana Challenges"
            sizeHint="~1 MB · every speed-katakana set"
            enabledKey="katakana-preload-enabled"
            completeKey="katakana-preload-complete"
            startPreload={preloadKatakanaChallenges}
            clearCache={clearKatakanaCache}
          />
        </section>

        <section>
          <h3 className={sectionHeadingCn}>Presentation</h3>

          <div className="mb-4">
            <span className="mb-2 block text-sm font-semibold">Font</span>
            <FontGrid />
          </div>

          <div className="mb-4">
            <span className="mb-2 block text-sm font-semibold">
              Background Color
            </span>
            <ColorGrid />
          </div>

          <LightDarkRow />
        </section>
      </DialogContent>
    </Dialog>
  );
};
