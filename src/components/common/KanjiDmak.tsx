/* eslint-disable @typescript-eslint/no-explicit-any */
import Raphael from "raphael";
import "dmak";
import { useEffect, useId, useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { PlayCircle, Snail } from "@/components/icons";
import assetsPaths from "@/lib/assets-paths";
import { abandonDmak, installSafeDmakLoader } from "@/lib/dmak-safe-loader";

// Stock dmak crashes on null kvg: root — install our guarded loader once.
installSafeDmakLoader();

export type AnimationSpeed = "fast" | "slow";

export const SPEEDS: Record<AnimationSpeed, { rate: number }> = {
  fast: { rate: 0.0095 },
  slow: { rate: 0.022 },
};

export const KanjiDMAK = ({
  kanji,
  step = SPEEDS.slow.rate,
  size,
  staticMode = false,
  gridShow = true,
}: {
  kanji: string;
  step?: number;
  size: number;
  // when true: draws all strokes instantly with stroke-order numbers visible
  staticMode?: boolean;
  gridShow?: boolean;
}) => {
  const id = useId();
  const kanjiId = `${id}-${kanji}-draw`;

  useEffect(() => {
    (window as any).Raphael = Raphael;

    const dmak = new (window as any).Dmak(kanji, {
      element: kanjiId,
      uri:
        import.meta.env.MODE === "development" ||
        window.location.protocol === "http:"
          ? assetsPaths.dev.KANJI_SVGS
          : assetsPaths.KANJI_SVGS,
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
  }, [kanji, kanjiId, step, size, staticMode, gridShow]);

  return <div id={kanjiId} />;
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
  const replay = () => setKey((x) => x + 1);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        title="Replay stroke order"
        className={
          replayClassName
            ? `${replayClassName} cursor-pointer`
            : "cursor-pointer"
        }
        style={{ height: size }}
        onClick={replay}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            replay();
          }
        }}
      >
        {/** key needed to redraw on change  */}
        <div key={`${kanji}-${speed}-${key}`}>
          <KanjiDMAK kanji={kanji} step={SPEEDS[speed].rate} size={size} />
        </div>
      </div>
      <div className={buttonRowClassName}>
        <PracticeButton
          size="icon"
          className={buttonClassName}
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
