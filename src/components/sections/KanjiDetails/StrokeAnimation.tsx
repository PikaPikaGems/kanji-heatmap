/* eslint-disable @typescript-eslint/no-explicit-any */
import Raphael from "raphael";
import "dmak";
import { useEffect, useId, useRef, useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { Switch } from "@/components/ui/switch";
import assetsPaths from "@/lib/assets-paths";
import { installSafeDmakLoader } from "@/lib/dmak-safe-loader";
import { PlayCircle, Snail } from "@/components/icons";
import {
  DrawingPad,
  DrawingSubmitPayload,
  Stroke,
} from "@/components/dependent/DrawingPad";
import { recognizeWithDaKanji } from "@/components/screens/ListScreen/ControlBar/SearchInput/HandwritingScreen/recognizers";
import { gradeMessage, type GradeResult } from "@/lib/dakanji-grade";
import { useFitPadSize } from "@/hooks/use-fit-pad-size";
import { CONTAINER_CN, SVG_SIZE } from "./stroke-animation-constants";
import { Rocket } from "lucide-react";

// Stock dmak crashes on null kvg: root — install our guarded loader once.
installSafeDmakLoader();

type AnimationSpeed = "fast" | "slow";

const SPEEDS: Record<AnimationSpeed, { rate: number }> = {
  fast: { rate: 0.0095 },
  slow: { rate: 0.022 },
};

const KanjiDMAK = ({
  kanji,
  step = SPEEDS.slow.rate,
  size = SVG_SIZE,
  staticMode = false,
  gridShow = true,
}: {
  kanji: string;
  step?: number;
  size?: number;
  // when true: draws all strokes instantly with stroke-order numbers visible
  staticMode?: boolean;
  gridShow?: boolean;
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

      grid: { show: gridShow },
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
        <PracticeButton
          size="icon"
          onClick={() => {
            setSpeed("fast");
            setKey((x) => {
              return x + 1;
            });
          }}
        >
          <PlayCircle />
          <span className="sr-only">Animate</span>
        </PracticeButton>
        <PracticeButton
          size="icon"
          variant="secondary"
          onClick={() => {
            setSpeed("slow");
            setKey((x) => {
              return x + 1;
            });
          }}
        >
          <Snail /> <span className="sr-only">Animate Slowly</span>
        </PracticeButton>
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
        <KanjiDMAK
          kanji={kanji}
          staticMode
          size={HINT_SVG_SIZE}
          gridShow={false}
        />
      </div>
    </div>
  );
};

type GradeStatus = "idle" | "loading" | "success" | "error";

const DAKANJI_CREDIT_HREF =
  "https://github.com/dariyooo/DaKanji-Single-Kanji-Recognition";

const WritingPracticeMode = ({ kanji }: { kanji: string }) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [status, setStatus] = useState<GradeStatus>("idle");
  const [result, setResult] = useState<GradeResult | null>(null);
  const padSize = useFitPadSize(SVG_SIZE);

  useEffect(() => {
    setStrokes([]);
    setStatus("idle");
    setResult(null);
  }, [padSize]);

  const onGrade = async (payload: DrawingSubmitPayload) => {
    if (payload.strokes.length === 0) {
      return;
    }

    setStatus("loading");
    setResult(null);
    try {
      const candidates = await recognizeWithDaKanji(payload);
      setResult({
        rank: candidates.indexOf(kanji),
        topGuess: candidates[0] ?? null,
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const onClear = () => {
    setStatus("idle");
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center gap-3 px-2 pt-4 pb-6 sm:px-4 animate-fade-in">
      <DrawingPad
        svgSize={padSize}
        strokes={strokes}
        setStrokes={setStrokes}
        showSubmitBtn
        submitIcon={<Rocket />}
        submitLabel="Grade"
        submitDisabled={status === "loading"}
        onClickSubmit={onGrade}
        onClickClear={onClear}
      />

      <div className="w-full max-w-[310px] min-h-10 px-2 text-base font-bold text-center">
        {status === "loading" && (
          <div className="animate-fade-in opacity-80">採点中 · Grading…</div>
        )}
        {status === "error" && (
          <div className="animate-fade-in text-destructive">
            The DaKanji recognizer couldn&apos;t be loaded right now.
          </div>
        )}
        {status === "success" && result != null && (
          <div className="animate-fade-in">{gradeMessage(kanji, result)}</div>
        )}
        {status === "idle" && (
          <div className="font-bold">Draw the kanji, then tap 🚀 to grade.</div>
        )}
      </div>

      <p className="max-w-[310px] text-center text-[11px] leading-relaxed opacity-70">
        Grading powered by DaKanji ·{" "}
        <a
          href={DAKANJI_CREDIT_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline underline-offset-2 hover:opacity-80"
        >
          Dariyooo (DaAppLab)
        </a>{" "}
        💪
      </p>
    </div>
  );
};

export const StrokeAnimationWithPracticeMode = ({
  kanji,
  defaultPracticeMode = false,
}: {
  kanji: string;
  /** When true (e.g. practice modal), start on the drawing pad. */
  defaultPracticeMode?: boolean;
}) => {
  const [practiceMode, setPracticeMode] = useState(defaultPracticeMode);

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

          {practiceMode && (
            <div className="absolute right-0 z-10 px-2 m-4 border border-dashed sm:-right-8 animate-fade-in rounded-2xl -top-10 border-foreground bg-background/80">
              <HintSection key={kanji} kanji={kanji} />
            </div>
          )}
        </div>
      </div>
      {/*
        Cap min-height to the dialog/viewport so short phones don't get a
        forced 530px panel (which overflows and feels broken).
      */}
      <div className="min-h-[min(530px,calc(90dvh-11rem))]">
        {practiceMode ? (
          <WritingPracticeMode kanji={kanji} />
        ) : (
          <StrokeAnimation kanji={kanji} />
        )}
      </div>
    </div>
  );
};

export default StrokeAnimationWithPracticeMode;
