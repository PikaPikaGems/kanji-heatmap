/* eslint-disable @typescript-eslint/no-explicit-any */
import Raphael from "raphael";
import "dmak";
import { useEffect, useId, useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { PlayCircle, Snail } from "@/components/icons";
import { abandonDmak, installSafeDmakLoader } from "@/lib/dmak-safe-loader";
import {
  kanjiSvgBaseUri,
  kanjiSvgCode,
  kanjiSvgUrl,
} from "@/lib/kanji-svg-url";
import { StrokeOrderUnavailable } from "@/components/common/StrokeOrderUnavailable";
import { AnimationSpeed, SPEEDS } from "./kanji-dmak-speeds";

// Stock dmak crashes on null kvg: root — install our guarded loader once.
installSafeDmakLoader();

type SvgLoadStatus = "loading" | "ready" | "error";

async function preflightKanjiSvg(
  kanji: string,
  signal: AbortSignal
): Promise<boolean> {
  const res = await fetch(kanjiSvgUrl(kanji), { signal });
  if (!res.ok) return false;
  const body = await res.text();
  const code = kanjiSvgCode(kanji);
  // KanjiVG roots look like id="kvg:05c71" — reject empty / wrong payloads.
  return body.includes(`kvg:${code}`);
}

export const KanjiDMAK = ({
  kanji,
  step = SPEEDS.slow.rate,
  size,
  staticMode = false,
  gridShow = true,
  onUnavailableChange,
}: {
  kanji: string;
  step?: number;
  size: number;
  // when true: draws all strokes instantly with stroke-order numbers visible
  staticMode?: boolean;
  gridShow?: boolean;
  /** Fired when the SVG becomes unavailable or recovers (e.g. hint blur). */
  onUnavailableChange?: (unavailable: boolean) => void;
}) => {
  const id = useId();
  const kanjiId = `${id}-${kanji}-draw`;
  const [retryKey, setRetryKey] = useState(0);
  const [status, setStatus] = useState<SvgLoadStatus>("loading");

  // Needed: probe CDN/cache reachability; no render-time API for this.
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    onUnavailableChange?.(false);

    preflightKanjiSvg(kanji, controller.signal)
      .then((ok) => {
        if (controller.signal.aborted) return;
        setStatus(ok ? "ready" : "error");
        onUnavailableChange?.(!ok);
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
    if (status !== "ready") return;

    (window as any).Raphael = Raphael;

    const dmak = new (window as any).Dmak(kanji, {
      element: kanjiId,
      uri: kanjiSvgBaseUri(),
      height: size,
      width: size,
      step: step,
      // NOTE: dmak's stroke.animated is an object { drawing, erasing }, not a boolean.
      // Passing a plain boolean breaks stroke.animated.drawing access — do not change.
      stroke: staticMode
        ? {
            animated: { drawing: false, erasing: false },
            order: { visible: true },
            attr: { stroke: "random" },
          }
        : { attr: { stroke: "random" } },

      grid: { show: gridShow },
    });

    return () => {
      abandonDmak(dmak);
      // Strict Mode re-runs this effect on the same host — clear leftover SVG.
      document.getElementById(kanjiId)?.replaceChildren();
      // Keep window.Raphael set; other KanjiDMAK instances may still need it.
    };
  }, [status, kanji, kanjiId, step, size, staticMode, gridShow]);

  if (status === "error") {
    return (
      <StrokeOrderUnavailable
        size={size}
        onRetry={() => setRetryKey((k) => k + 1)}
      />
    );
  }

  // Sized host while loading / ready — avoids layout shift vs the drawn SVG.
  return <div id={kanjiId} style={{ width: size, height: size }} />;
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
}: {
  kanji: string;
  size: number;
  replayClassName?: string;
  buttonRowClassName?: string;
  buttonClassName?: string;
}) => {
  const [key, setKey] = useState(1);
  const [speed, setSpeed] = useState<AnimationSpeed>("fast");
  const [unavailable, setUnavailable] = useState(false);
  const replay = () => setKey((x) => x + 1);

  return (
    <>
      <div
        role="button"
        tabIndex={unavailable ? -1 : 0}
        title={unavailable ? undefined : "Replay stroke order"}
        aria-disabled={unavailable || undefined}
        className={
          replayClassName
            ? `${replayClassName} ${unavailable ? "" : "cursor-pointer"}`
            : unavailable
              ? undefined
              : "cursor-pointer"
        }
        style={{ height: size }}
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
        <div key={`${kanji}-${speed}-${key}`}>
          <KanjiDMAK
            kanji={kanji}
            step={SPEEDS[speed].rate}
            size={size}
            onUnavailableChange={setUnavailable}
          />
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
