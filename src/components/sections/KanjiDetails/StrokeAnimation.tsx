import { useState, type CSSProperties } from "react";
import { Switch } from "@/components/ui/switch";
import { KanjiDMAK, StrokeOrderReplay } from "@/components/common/KanjiDmak";
import { DrawingPad } from "@/components/dependent/DrawingPad";
import type { DrawingSubmitPayload, Stroke } from "@/lib/stroke-types";
import { RecognizingStatus } from "@/components/common/RecognizingStatus";
import { recognizeWithDaKanji } from "@/components/screens/ListScreen/ControlBar/SearchInput/HandwritingScreen/recognizers";
import { gradeMessage, type GradeResult } from "@/lib/dakanji-grade";
import { useFitPadSize } from "@/hooks/use-fit-pad-size";
import {
  CONTAINER_CN,
  HINT_SVG_SIZE,
  SVG_SIZE,
} from "./stroke-animation-constants";
import { otherOutLinks } from "@/lib/external-links";
import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

// Below `sm` DrawingPad sits 8px higher (`my-2` vs `sm:m-4`; only the top
// differs, its gap to the buttons stays 16px) and shrinks to
// fit narrow screens, so match both here or toggling practice mode shifts the
// box. From `sm` up the original `p-4` + `my-4` already lines up.
export const StrokeAnimation = ({ kanji }: { kanji: string }) => {
  const size = useFitPadSize(SVG_SIZE);
  return (
    <div className="p-4">
      <StrokeOrderReplay
        kanji={kanji}
        size={size}
        replayClassName={cn(CONTAINER_CN, "mt-2 mb-4 sm:mt-4")}
        showSettings={true}
      />
    </div>
  );
};

const HintSection = ({ kanji }: { kanji: string }) => {
  const [blurred, setBlurred] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  return (
    <div
      className={unavailable ? undefined : "cursor-pointer"}
      title={
        unavailable
          ? undefined
          : blurred
            ? "Click to reveal hint"
            : "Click to hide hint"
      }
      onClick={unavailable ? undefined : () => setBlurred((b) => !b)}
    >
      <div
        style={{
          // Don't blur the offline/error icon — it must stay readable + clickable.
          filter: unavailable || !blurred ? "none" : "blur(8px)",
          transition: "filter 0.2s ease",
          userSelect: "none",
          pointerEvents: unavailable ? "auto" : "none",
        }}
      >
        <KanjiDMAK
          kanji={kanji}
          staticMode
          size={HINT_SVG_SIZE}
          gridShow={false}
          onUnavailableChange={setUnavailable}
        />
      </div>
    </div>
  );
};

type GradeStatus = "idle" | "loading" | "success" | "error";

const GradeStatusCopy = ({
  status,
  kanji,
  result,
}: {
  status: GradeStatus;
  kanji: string;
  result: GradeResult | null;
}) => {
  if (status === "loading") {
    return (
      <div className="animate-fade-in opacity-80">
        <RecognizingStatus label="採点中 · Grading…" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="animate-fade-in">
        すみません 🥺 🙇. The grader {`couldn't`} be loaded right now.
      </div>
    );
  }

  if (status === "success" && result != null) {
    return (
      <div className="animate-practice-bounce-soft">
        {gradeMessage(kanji, result)}
      </div>
    );
  }

  return <div className="font-bold">Draw the kanji, then tap 🚀 to grade.</div>;
};

const DaKanjiCredit = () => (
  <p className="max-w-[310px] text-center text-[11px] leading-relaxed opacity-70">
    Grading powered by DaKanji ·{" "}
    <a
      href={otherOutLinks.dakanji}
      target="_blank"
      rel="noopener noreferrer"
      className="font-bold underline underline-offset-2 hover:opacity-80"
    >
      Dariyooo (DaAppLab)
    </a>{" "}
    💪
  </p>
);

const WritingPracticeMode = ({ kanji }: { kanji: string }) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [status, setStatus] = useState<GradeStatus>("idle");
  const [result, setResult] = useState<GradeResult | null>(null);
  const padSize = useFitPadSize(SVG_SIZE);

  // Reset the drawing when the pad is resized — in-render previous-state
  // pattern instead of a sync effect.
  const [prevPadSize, setPrevPadSize] = useState(padSize);
  if (prevPadSize !== padSize) {
    setPrevPadSize(padSize);
    setStrokes([]);
    setStatus("idle");
    setResult(null);
  }

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
        overlay={
          status === "idle" ? undefined : (
            <div className="absolute inset-x-0 top-0 z-10 hidden px-2 pt-2 pointer-events-none [@media(max-height:40rem)]:block">
              <div className="px-2 py-1.5 text-sm font-bold text-center rounded-2xl bg-background/90">
                <GradeStatusCopy
                  status={status}
                  kanji={kanji}
                  result={result}
                />
              </div>
            </div>
          )
        }
      />
      <div className="w-full max-w-[310px] min-h-10 px-2 text-base font-bold text-center [@media(max-height:40rem)]:hidden">
        <GradeStatusCopy status={status} kanji={kanji} result={result} />
      </div>
      <DaKanjiCredit />
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
  const padSize = useFitPadSize(SVG_SIZE);

  return (
    <div key={kanji}>
      <div className="flex px-4 pt-6 pb-3">
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

          {/*
              Below `sm`, line the hint up with the pad's right edge (the pad is
              centered, so that edge is half the pad width right of center).
              From `sm` up it keeps hanging off the row's right edge (-right-4
              equals the old `right: -2rem` + `m-4` margin).
            */}
          {practiceMode && (
            <div
              className="absolute right-[var(--hint-right)] z-10 px-2 mt-4 border border-dashed sm:-right-4 animate-fade-in rounded-2xl -top-10 border-foreground bg-background/80"
              style={
                {
                  "--hint-right": `max(0px, calc(50% - ${padSize / 2}px))`,
                } as CSSProperties
              }
            >
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
