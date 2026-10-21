import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Trash2, Download, Loader2, CircleX } from "@/components/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocalStorageFlag } from "@/hooks/use-local-storage";
import { useStorageValue } from "@/hooks/use-storage-value";
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
import { approxRowCountLabel } from "@/lib/fill-the-kanji/batches";
import {
  fillTheKanjiSetBytes,
  KANJI_SVG_SIZES,
  KATAKANA_SIZES,
} from "@/lib/download-sizes";
import { formatApproxBytes, formatApproxCount } from "@/lib/format-count";
import { Button } from "@/components/ui/button";

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
              Download Fill in the Kanji Challenges
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {downloaded}/{FILL_THE_KANJI_SETS.length} challenge sets
              downloaded
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-0 pl-3 border-l-2 border-dotted">
          {FILL_THE_KANJI_SETS.map(({ id, label, unit }) => (
            <DataDownloadRow
              key={id}
              label={label}
              sizeHint={`${
                hasOutdatedFillTheKanjiDownload(id) ? "Update available · " : ""
              }${formatApproxBytes(fillTheKanjiSetBytes(id))} · ${approxRowCountLabel(id)} ${unit}`}
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

/** Downloads for offline use: stroke order SVGs, katakana and Fill in the Kanji sets. */
export const OfflineDownloads = () => (
  <>
    <DataDownloadRow
      label="Download Kanji SVGs"
      sizeHint={`${formatApproxBytes(KANJI_SVG_SIZES.bytes)} · stroke order for ${formatApproxCount(KANJI_SVG_SIZES.count)} kanji`}
      completeKey="svg-preload-complete"
      startPreload={preloadKanjiSvgs}
      clearCache={clearKanjiSvgCache}
    />
    <DataDownloadRow
      label="Download Katakana Challenges"
      sizeHint={`${formatApproxBytes(KATAKANA_SIZES.bytes)} · ${formatApproxCount(KATAKANA_SIZES.count)} speed katakana words`}
      completeKey="katakana-preload-complete"
      startPreload={preloadKatakanaChallenges}
      clearCache={clearKatakanaCache}
    />
    <FillTheKanjiDownloads />
  </>
);
