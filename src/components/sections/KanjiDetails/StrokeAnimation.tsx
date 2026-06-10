/* eslint-disable @typescript-eslint/no-explicit-any */
import Raphael from "raphael";
import "dmak";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import assetsPaths from "@/lib/assets-paths";
import { PlayCircle, Snail } from "@/components/icons";
import { DrawingPad } from "@/components/dependent/DrawingPad";

type AnimationSpeed = "fast" | "slow";

const SPEEDS: Record<AnimationSpeed, { rate: number }> = {
  fast: { rate: 0.0095 },
  slow: { rate: 0.022 },
};

const SVG_SIZE = 280;
const CONTAINER_CN = `flex w-full justify-center my-4 h-[${SVG_SIZE}px]`;

const KanjiDMAK = ({
  kanji,
  step = SPEEDS.slow.rate,
  size = SVG_SIZE,
  staticMode = false,
  gridShow = true
}: {
  kanji: string;
  step?: number;
  size?: number;
  // when true: draws all strokes instantly with stroke-order numbers visible
  staticMode?: boolean;
  gridShow?: boolean
}) => {
  const dmakInstanceRef = useRef<any>(null);
  const id = useId();
  const kanjiId = `${id}-${kanji}-draw`;

  useEffect(() => {
    (window as any).Raphael = Raphael;

    if (dmakInstanceRef.current) {
      return;
    }

    dmakInstanceRef.current = new (window as any).Dmak(kanji, {
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

      grid: { show: gridShow }
    });

    return () => {
      (window as any).Raphael = null;
    };
  }, [kanji, kanjiId, step, size, staticMode, gridShow]);

  return <div id={kanjiId} />;
};

export const StrokeAnimation = ({ kanji }: { kanji: string }) => {
  const [key, setKey] = useState(1);
  const [speed, setSpeed] = useState<AnimationSpeed>("fast");

  return (
    <div className="p-4">
      {/** key needed to redraw on change  */}
      <div
        className={CONTAINER_CN}
        style={{ height: SVG_SIZE }}
        key={`${kanji}-${speed}-${key}`}
      >
        <KanjiDMAK kanji={kanji} step={SPEEDS[speed].rate} />
      </div>
      <div className="flex justify-center space-x-2">
        <Button
          onClick={() => {
            setSpeed("fast");
            setKey((x) => {
              return x + 1;
            });
          }}
        >
          <PlayCircle className="scale-150" />
          <span className="sr-only">Animate</span>
        </Button>
        <Button
          onClick={() => {
            setSpeed("slow");
            setKey((x) => {
              return x + 1;
            });
          }}
          variant={"secondary"}
        >
          <Snail className="scale-150" />{" "}
          <span className="sr-only">Animate Slowly</span>
        </Button>
      </div>
    </div>
  );
};


const HINT_SVG_SIZE = 85;

const HintSection = ({ kanji }: { kanji: string }) => {
  const [blurred, setBlurred] = useState(true);

  return (
    <div
      className="cursor-pointer"
      title={blurred ? "Click to reveal hint" : "Click to hide hint"}
      onClick={() => setBlurred((b) => !b)}
    >
      <div
        style={{
          filter: blurred ? "blur(8px)" : "none",
          transition: "filter 0.2s ease",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        <KanjiDMAK kanji={kanji} staticMode size={HINT_SVG_SIZE} gridShow={false} />
      </div>
    </div>
  );
};

const WritingPracticeMode = () => {
  return (
    <div className="flex flex-col items-center gap-4 px-4 pt-4 animate-fade-in">
      <DrawingPad svgSize={SVG_SIZE} />
    </div>
  );
};

const StrokeAnimationWithPracticeMode = ({ kanji }: { kanji: string }) => {
  const [practiceMode, setPracticeMode] = useState(false);

  return (
    <div key={kanji}>
      <div className="flex px-4 pt-6">
        <div className="relative flex items-center w-full gap-2 mb-4">
          <Switch
            id="practice-mode"
            checked={practiceMode}
            onCheckedChange={setPracticeMode}
          />
          <label
            htmlFor="practice-mode"
            className="text-xs font-bold cursor-pointer select-none"
          >
            Practice writing
          </label>

          {practiceMode && <div className="absolute px-2 m-4 border border-dashed -right-8 animate-fade-in rounded-2xl -top-10 border-foreground">
            <HintSection key={kanji} kanji={kanji} />
          </div>}
        </div>
      </div>
      {practiceMode ? (
        <WritingPracticeMode />
      ) : (
        <StrokeAnimation kanji={kanji} />
      )}
    </div>
  );
};

export default StrokeAnimationWithPracticeMode;
