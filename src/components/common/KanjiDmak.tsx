/* eslint-disable @typescript-eslint/no-explicit-any */
import Raphael from "raphael";
import "dmak";
import { useEffect, useId, useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { PlayCircle, Snail } from "@/components/icons";
import { abandonDmak, installSafeDmakLoader } from "@/lib/dmak-safe-loader";
import { resolveKanjiSvgBaseUri } from "@/lib/kanji-svg-url";
import {
  StrokeOrderLoading,
  StrokeOrderUnavailable,
} from "@/components/common/StrokeOrderUnavailable";
import { StrokeAnimationSettingsPopover } from "./StrokeAnimationSettingsPopover";
import { useStrokeAnimationSettings } from "@/hooks/use-stroke-animation-settings";
import { AnimationSpeed, dmakStepForSpeed } from "./kanji-dmak-speeds";

// Stock dmak crashes on null kvg: root — install our guarded loader once.
installSafeDmakLoader();

// "loading" lasts until dmak has fetched and parsed the strokes, not just
// until the probe finds a reachable SVG: dmak fetches it again itself.
type SvgLoadStatus = "loading" | "ready" | "error";

export const KanjiDMAK = ({
  kanji,
  step,
  size,
  staticMode = false,
  gridShow = true,
  onUnavailableChange,
}: {
  kanji: string;
  step?: number;
  size: number;
  // when true: draws all strokes instantly
  staticMode?: boolean;
  gridShow?: boolean;
  /** Fired when the SVG becomes unavailable or recovers (e.g. hint blur). */
  onUnavailableChange?: (unavailable: boolean) => void;
}) => {
  const id = useId();
  const kanjiId = `${id}-${kanji}-draw`;
  const [retryKey, setRetryKey] = useState(0);
  const [status, setStatus] = useState<SvgLoadStatus>("loading");
  const [svgBaseUri, setSvgBaseUri] = useState<string | null>(null);
  const [{ showStrokeOrderNumbers }] = useStrokeAnimationSettings();

  // Needed: probe local/CDN reachability; no render-time API for this.
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    // Reset so a retry re-creates dmak even when the uri comes back the same.
    setSvgBaseUri(null);
    onUnavailableChange?.(false);

    resolveKanjiSvgBaseUri(kanji, controller.signal)
      .then((baseUri) => {
        if (controller.signal.aborted) return;
        setSvgBaseUri(baseUri);
        if (baseUri == null) {
          setStatus("error");
          onUnavailableChange?.(true);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
        onUnavailableChange?.(true);
      });

    return () => controller.abort();
  }, [kanji, retryKey, onUnavailableChange]);

  // Needed: dmak + Raphael mount into a DOM node; no declarative equivalent.
  useEffect(() => {
    if (!svgBaseUri) return;
    let cancelled = false;

    (window as any).Raphael = Raphael;

    const dmak = new (window as any).Dmak(kanji, {
      element: kanjiId,
      uri: svgBaseUri,
      height: size,
      width: size,
      step: step,
      // NOTE: dmak's stroke.animated is an object { drawing, erasing }, not a boolean.
      // Passing a plain boolean breaks stroke.animated.drawing access — do not change.
      stroke: {
        ...(staticMode ? { animated: { drawing: false, erasing: false } } : {}),
        attr: { stroke: "random" },
        order: { visible: showStrokeOrderNumbers },
      },

      grid: { show: gridShow },
      // Runs after dmak's own fetch. No strokes means that fetch failed or
      // the SVG had no kvg root; show the retry state instead of a blank box.
      loaded: (strokes: unknown[]) => {
        if (cancelled) return;
        const ok = strokes.length > 0;
        setStatus(ok ? "ready" : "error");
        if (!ok) onUnavailableChange?.(true);
      },
    });

    return () => {
      cancelled = true;
      abandonDmak(dmak);
      // Strict Mode re-runs this effect on the same host — clear leftover SVG.
      document.getElementById(kanjiId)?.replaceChildren();
      // Keep window.Raphael set; other KanjiDMAK instances may still need it.
    };
  }, [
    svgBaseUri,
    onUnavailableChange,
    kanji,
    kanjiId,
    step,
    size,
    staticMode,
    gridShow,
    showStrokeOrderNumbers,
  ]);

  if (status === "error") {
    return (
      <StrokeOrderUnavailable
        size={size}
        onRetry={() => setRetryKey((k) => k + 1)}
      />
    );
  }

  // The host stays mounted while loading: dmak draws into it, and the snail
  // sits on top until the strokes are ready. Sized to avoid layout shift.
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div id={kanjiId} style={{ width: size, height: size }} />
      {status === "loading" && (
        <div className="absolute inset-0">
          <StrokeOrderLoading size={size} />
        </div>
      )}
    </div>
  );
};

/**
 * Replayable stroke-order animation: click (or Enter/Space) on the drawing
 * replays it; the two buttons replay at fast/slow speed. Layout is left to
 * the parent container; the className props carry the per-screen styling.
 */
export const StrokeOrderReplay = ({
  kanji,
  size,
  replayClassName,
  buttonRowClassName = "flex justify-center space-x-2",
  buttonClassName,
  showSettings = false,
}: {
  kanji: string;
  size: number;
  replayClassName?: string;
  buttonRowClassName?: string;
  buttonClassName?: string;
  showSettings?: boolean;
}) => {
  const [key, setKey] = useState(1);
  const [speed, setSpeed] = useState<AnimationSpeed>("fast");
  const [unavailable, setUnavailable] = useState(false);
  const [settings] = useStrokeAnimationSettings();
  const replay = () => setKey((x) => x + 1);

  return (
    <>
      <div className={replayClassName} style={{ height: size }}>
        {/* Overlay border so dotted stroke doesn't change the box's layout size. */}
        <div
          className="relative overflow-hidden rounded-3xl shrink-0"
          style={{ width: size, height: size }}
        >
          <div
            role="button"
            tabIndex={unavailable ? -1 : 0}
            title={unavailable ? undefined : "Replay stroke order"}
            aria-disabled={unavailable || undefined}
            className={unavailable ? undefined : "cursor-pointer"}
            style={{ width: size, height: size }}
            onClick={unavailable ? undefined : replay}
            onKeyDown={
              unavailable
                ? undefined
                : (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      replay();
                    }
                  }
            }
          >
            {/** key needed to redraw on change  */}
            <div
              key={`${kanji}-${speed}-${key}-${settings.fastSpeed}-${settings.slowSpeed}-${settings.showStrokeOrderNumbers}`}
            >
              <KanjiDMAK
                kanji={kanji}
                step={dmakStepForSpeed(speed, settings)}
                size={size}
                onUnavailableChange={setUnavailable}
              />
            </div>
          </div>
          <div
            aria-hidden
            className="absolute inset-0 border-2 border-dotted pointer-events-none rounded-3xl border-foreground"
          />
          {showSettings && (
            <div className="absolute z-10 top-3 left-3">
              <StrokeAnimationSettingsPopover />
            </div>
          )}
        </div>
      </div>
      <div className={buttonRowClassName}>
        <PracticeButton
          size="icon"
          className={buttonClassName}
          disabled={unavailable}
          onClick={() => {
            setSpeed("fast");
            replay();
          }}
        >
          <PlayCircle />
          <span className="sr-only">Animate</span>
        </PracticeButton>
        <PracticeButton
          size="icon"
          variant="secondary"
          className={buttonClassName}
          disabled={unavailable}
          onClick={() => {
            setSpeed("slow");
            replay();
          }}
        >
          <Snail />
          <span className="sr-only">Animate Slowly</span>
        </PracticeButton>
      </div>
    </>
  );
};
