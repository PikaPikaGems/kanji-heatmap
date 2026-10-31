import { useEffect, useMemo, useRef, useState } from "react";
import { Rocket } from "lucide-react";
import { DrawingPad } from "@/components/dependent/DrawingPad";
import type { DrawingSubmitPayload, Stroke } from "@/lib/stroke-types";
import { useSpeak } from "@/hooks/use-jp-speak";
import { useKeepAiVoiceWarm } from "@/hooks/use-ai-voice";
import { useEnterAction } from "@/hooks/use-enter-action";
import { useFitPadSize } from "@/hooks/use-fit-pad-size";
import { useCorrectSound } from "@/hooks/use-correct-sound";
import { FORGOT_KEYS } from "@/components/shared-practice";
import type {
  MasteryGrading,
  PassingRating,
} from "@/components/shared-practice";
import { EndSession } from "@/components/shared-practice/EndSessionButton";
import {
  useGetKanjiInfoFn,
  useSimilarKanjiMap,
  useSimilarKanjis,
} from "@/kanji-worker/kanji-worker-hooks";
import { RecognizingStatus } from "@/components/common/RecognizingStatus";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import { ClozeWords, HintsPopover } from "./ClozeWord";
import { buildCandidateGrid } from "./build-candidates";
import { DRAW_SVG_SIZE, GRADE_TOP_K, soundOf } from "./constants";
import { SelectSimilarKanjiDrawer } from "./drawers/SelectSimilarKanjiDrawer";
import { FeedbackDrawer } from "./drawers/FeedbackDrawer";
import {
  DrawingSnapshot,
  GradeRankInfo,
  PracticeItem,
  ProductionPracticeSettings,
  SessionResult,
} from "./types";

const ENTER_OR_SPACE = ["Enter", " "] as const;
const NO_GRADE: GradeRankInfo = { rank: -1, topGuess: null, inTop10: false };

type CardStep =
  | { type: "draw" }
  | { type: "recognizing" }
  | {
      type: "select";
      grade: GradeRankInfo;
      candidates: string[];
      /** True when recognize threw; pick-only for this card. */
      recognitionSkipped?: boolean;
    }
  | {
      type: "feedback";
      kind: "noKanji" | "correct" | "incorrect";
      grade: GradeRankInfo;
      recognitionSkipped?: boolean;
    };

export const Game = ({
  sessionItems,
  settings,
  randomKanjiPool,
  gradingEnabled = true,
  grading,
  recognize,
  onProgress,
  onComplete,
  onEnd,
}: {
  sessionItems: PracticeItem[];
  settings: ProductionPracticeSettings;
  randomKanjiPool: string[];
  /** When false, skip recognition and score by pick only. */
  gradingEnabled?: boolean;
  /**
   * Mastery game only: the pick step rates with Forgot / Hard / Good / Easy
   * instead of Next. A wrong kanji grades "again" instead.
   */
  grading?: MasteryGrading;
  recognize: (payload: DrawingSubmitPayload) => Promise<string[]>;
  onProgress: (progress: number) => void;
  onComplete: (results: SessionResult[]) => void;
  onEnd: () => void;
}) => {
  const [index, setIndex] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState<DrawingSnapshot | null>(null);
  const [step, setStep] = useState<CardStep>({ type: "draw" });
  const [selected, setSelected] = useState<string | null>(null);
  const resultsRef = useRef<SessionResult[]>([]);
  const drawSubmitRef = useRef<(payload: DrawingSubmitPayload) => void>(
    () => {}
  );
  const forgotFromDrawRef = useRef<() => void>(() => {});
  const padSize = useFitPadSize(DRAW_SVG_SIZE);

  const current = sessionItems[index];
  const similarState = useSimilarKanjis(current?.kanji ?? "");
  const similars = similarState.data ?? [];
  const getKanjiInfo = useGetKanjiInfoFn();
  const similarMap = useSimilarKanjiMap();
  const getSimilars = useMemo(
    () => (k: string) => similarMap?.[k] ?? [],
    [similarMap]
  );
  // Every kanji in the similar map comes from a kanji dictionary, so it is a
  // real kanji even when it is outside kanji_main.
  const similarMapKanji = useMemo(
    () => new Set(Object.values(similarMap ?? {}).flat()),
    [similarMap]
  );
  const speak = useSpeak(current?.word ?? "");
  // Games keep the AI voice in memory so words after a pause play promptly.
  useKeepAiVoiceWarm();
  const playCorrect = useCorrectSound();

  // Reset per-card state when the card (index) or pad size changes — done
  // during render (previous-state pattern), not in a sync effect.
  const [prevCard, setPrevCard] = useState({ index, padSize });
  if (prevCard.index !== index || prevCard.padSize !== padSize) {
    setPrevCard({ index, padSize });
    setStrokes([]);
    setDrawing(null);
    if (prevCard.index !== index) {
      setStep({ type: "draw" });
      setSelected(null);
    }
  }

  useEffect(() => {
    if (!current || !settings.hearPronunciationOnLoad) return;
    if (step.type !== "draw") return;
    speak();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- speak on card load only
  }, [index, settings.hearPronunciationOnLoad]);

  // Enter/Space submits when there are strokes. Practice never Forgets via
  // keyboard.
  const submitViaKeyboard = useMemo(
    () =>
      step.type === "draw" && strokes.length > 0
        ? () =>
            drawSubmitRef.current({
              strokes,
              width: padSize,
              height: padSize,
            })
        : null,
    [step.type, strokes, padSize]
  );
  useEnterAction(submitViaKeyboard, true, ENTER_OR_SPACE);
  // Mastery: "?" is Forgot while the draw step's Forgot button is enabled.
  useEnterAction(
    grading && step.type === "draw" ? () => forgotFromDrawRef.current() : null,
    true,
    FORGOT_KEYS
  );

  if (!current) {
    return null;
  }

  const pushResult = (correct: boolean, gradeRank: number) => {
    const result: SessionResult = { ...current, correct, gradeRank };
    resultsRef.current = [...resultsRef.current, result];
  };

  const advance = () => {
    const nextIndex = index + 1;
    const allResults = resultsRef.current;
    if (nextIndex >= sessionItems.length) {
      onProgress(100);
      onComplete(allResults);
      return;
    }
    // Progress is reported here (the only place index advances) rather than
    // via an effect; the parent resets it to 0 when a session starts.
    onProgress((nextIndex / sessionItems.length) * 100);
    setIndex(nextIndex);
  };

  const onForgotFromDraw = () => {
    if (step.type !== "draw") return;
    grading?.onGrade("again");
    pushResult(false, -1);
    setStep({ type: "feedback", kind: "noKanji", grade: NO_GRADE });
  };

  forgotFromDrawRef.current = onForgotFromDraw;

  /** Records the answer and opens the feedback drawer. */
  const showFeedback = ({
    kind,
    correct,
    grade,
    rating,
    recognitionSkipped,
  }: {
    kind: "correct" | "incorrect";
    /** Counted correct for the session (and, in mastery, keeps `rating`). */
    correct: boolean;
    grade: GradeRankInfo;
    rating?: PassingRating;
    recognitionSkipped?: boolean;
  }) => {
    if (correct) {
      const sound = soundOf(settings);
      playCorrect({
        enabled: sound.enabled,
        speak: sound.enabled && sound.type === "speak" ? speak : undefined,
      });
    }
    // Mastery: a wrong kanji is "again", whatever rating was pressed. Every
    // mastery submit carries a rating; "good" (Enter's) is only a fallback.
    grading?.onGrade(correct ? (rating ?? "good") : "again");
    pushResult(correct, grade.rank);
    setStep({ type: "feedback", kind, grade, recognitionSkipped });
  };

  const openSelectStep = (
    grade: GradeRankInfo,
    modelGuesses: string[],
    recognitionSkipped = false
  ) => {
    // Require a kanji_main entry (jlpt) or a place in the similar map.
    // getKanjiInfo also returns radical part-keywords (e.g. 囗 → "closed
    // box"), which must not count.
    const isRealKanji = (k: string) =>
      getKanjiInfo?.(k)?.jlpt != null || similarMapKanji.has(k);
    const grid = buildCandidateGrid({
      target: current.kanji,
      modelGuesses,
      similars,
      randomPool: randomKanjiPool,
      getSimilars,
      isRealKanji,
    });
    setSelected(null);
    setStep({
      type: "select",
      grade,
      candidates: grid,
      recognitionSkipped,
    });
  };

  const onSubmit = async (payload: DrawingSubmitPayload) => {
    if (step.type !== "draw" || payload.strokes.length === 0) return;
    setDrawing(payload);

    // No handwriting model — skip recognition and go straight to lookalike pick.
    if (!gradingEnabled) {
      openSelectStep(NO_GRADE, [], false);
      return;
    }

    setStep({ type: "recognizing" });
    try {
      const candidates = await recognize(payload);
      const rank = candidates.indexOf(current.kanji);
      const grade = {
        rank,
        topGuess: candidates[0] ?? null,
        inTop10: rank >= 0 && rank < GRADE_TOP_K,
      };
      openSelectStep(grade, candidates);
    } catch {
      // Keep the session moving — pick-only for this card, with a quiet notice.
      openSelectStep(NO_GRADE, [], true);
    }
  };

  drawSubmitRef.current = onSubmit;

  const onSelectForgot = () => {
    if (step.type !== "select") return;
    grading?.onGrade("again");
    pushResult(false, step.grade.rank);
    setStep({
      type: "feedback",
      kind: "incorrect",
      grade: step.grade,
      recognitionSkipped: step.recognitionSkipped,
    });
  };

  /** `rating`: mastery game, the button (or key) that rated the pick. */
  const onSelectNext = (rating?: PassingRating) => {
    if (step.type !== "select" || selected == null) return;
    const pickedCorrect = selected === current.kanji;
    // With grading: drawing must also land in the model top-10.
    // Without (session-wide or this card's recognize failure): pick is enough.
    const gradeThisCard = gradingEnabled && !step.recognitionSkipped;
    showFeedback({
      kind: pickedCorrect ? "correct" : "incorrect",
      correct: gradeThisCard
        ? pickedCorrect && step.grade.inTop10
        : pickedCorrect,
      grade: step.grade,
      rating,
      recognitionSkipped: step.recognitionSkipped,
    });
  };

  const recognizing = step.type === "recognizing";
  const selectOpen = step.type === "select";
  const feedback = step.type === "feedback" ? step : null;
  const recognitionSkippedOnSelect =
    step.type === "select" && step.recognitionSkipped === true;
  // Pick-only UX for this card when recognize failed mid-session.
  const selectGradingEnabled = gradingEnabled && !recognitionSkippedOnSelect;
  const feedbackGradingEnabled =
    gradingEnabled && !(feedback?.recognitionSkipped === true);

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden">
      <EndSession onClick={onEnd} />

      <div className="flex flex-col items-center flex-1 min-h-0 px-4 pt-12 pb-4 overflow-y-auto sm:px-6 [justify-content:safe_center]">
        {!gradingEnabled && (
          <p
            className={cn(
              "mb-3 max-w-sm text-xs text-center animate-fade-in",
              cnWarningText
            )}
            role="status"
          >
            Playing without stroke grading — draw, then pick the kanji.
          </p>
        )}

        <ClozeWords item={current} revealed={feedback != null} />

        <div className="mt-4">
          <HintsPopover key={index} item={current} />
        </div>

        <div
          className="relative w-full mx-auto mt-4"
          style={{ maxWidth: padSize + 32 }}
        >
          <DrawingPad
            svgSize={padSize}
            strokes={strokes}
            setStrokes={setStrokes}
            showForgotBtn
            onClickForgot={onForgotFromDraw}
            forgotDisabled={recognizing || step.type !== "draw"}
            showSubmitBtn
            submitIcon={<Rocket />}
            submitLabel="Submit"
            submitDisabled={recognizing || step.type !== "draw"}
            onClickSubmit={onSubmit}
          />
          {recognizing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-background/70">
              <p className="text-sm font-bold sm:text-base animate-pulse">
                <RecognizingStatus label="Recognizing…" />
              </p>
            </div>
          )}
        </div>
      </div>

      <SelectSimilarKanjiDrawer
        open={selectOpen}
        grade={step.type === "select" ? step.grade : NO_GRADE}
        candidates={step.type === "select" ? step.candidates : []}
        selected={selected}
        gradingEnabled={selectGradingEnabled}
        recognitionSkipped={recognitionSkippedOnSelect}
        rating={
          grading && {
            intervals: grading.intervals,
            onRate: onSelectNext,
          }
        }
        onSelect={setSelected}
        onForgot={onSelectForgot}
        onNext={() => onSelectNext()}
      />

      <FeedbackDrawer
        open={feedback != null}
        kind={feedback?.kind ?? "noKanji"}
        item={current}
        grade={feedback?.grade ?? NO_GRADE}
        drawing={drawing}
        gradingEnabled={feedbackGradingEnabled}
        nextLabel={grading ? "Continue" : undefined}
        onNext={advance}
      />
    </div>
  );
};
