/* eslint-disable @typescript-eslint/no-explicit-any */
import Raphael from "raphael";
import "dmak";
import { useEffect, useId, useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { PlayCircle, Snail } from "@/components/icons";
import assetsPaths from "@/lib/assets-paths";
import { abandonDmak, installSafeDmakLoader } from "@/lib/dmak-safe-loader";

installSafeDmakLoader();

type AnimationSpeed = "fast" | "slow";

const SPEEDS: Record<AnimationSpeed, { rate: number }> = {
  fast: { rate: 0.0095 },
  slow: { rate: 0.022 },
};

const KanjiDMAK = ({
  kanji,
  step,
  size,
}: {
  kanji: string;
  step: number;
  size: number;
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
      step,
      stroke: { attr: { stroke: "random" } },
      grid: { show: true },
    });

    return () => {
      abandonDmak(dmak);
      // Strict Mode re-runs this effect on the same host — clear leftover SVG.
      document.getElementById(kanjiId)?.replaceChildren();
      // Keep window.Raphael set; other KanjiDMAK instances may still need it.
    };
  }, [kanji, kanjiId, step, size]);

  return <div id={kanjiId} />;
};

export const StrokeOrderPlayer = ({
  kanji,
  size = 160,
}: {
  kanji: string;
  size?: number;
}) => {
  const [key, setKey] = useState(1);
  const [speed, setSpeed] = useState<AnimationSpeed>("fast");
  const replay = () => setKey((x) => x + 1);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="button"
        tabIndex={0}
        title="Replay stroke order"
        className="cursor-pointer"
        style={{ height: size }}
        onClick={replay}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            replay();
          }
        }}
      >
        <div key={`${kanji}-${speed}-${key}`}>
          <KanjiDMAK kanji={kanji} step={SPEEDS[speed].rate} size={size} />
        </div>
      </div>
      <div className="flex justify-center space-x-1.5 sm:space-x-2">
        <PracticeButton
          size="icon"
          className="w-10 h-10 sm:h-12 sm:w-12"
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
          className="w-10 h-10 sm:h-12 sm:w-12"
          onClick={() => {
            setSpeed("slow");
            replay();
          }}
        >
          <Snail />
          <span className="sr-only">Animate Slowly</span>
        </PracticeButton>
      </div>
    </div>
  );
};
