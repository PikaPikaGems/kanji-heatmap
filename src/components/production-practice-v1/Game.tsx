import { useEffect, useRef, useState } from "react";
import { Rocket } from "lucide-react";
import {
  DrawingPad,
  DrawingSubmitPayload,
  Stroke,
} from "@/components/dependent/DrawingPad";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { SpeakButton } from "@/components/common/SpeakButton";
import { useSpeak } from "@/hooks/use-jp-speak";
import { useFitPadSize } from "@/hooks/use-fit-pad-size";
import { useCorrectSound } from "@/hooks/use-correct-sound";
import { BlurredGloss } from "@/components/shared-practice";
import { EndSession } from "@/components/shared-practice/EndSessionButton";
import {
  useGetKanjiInfoFn,
  useSimilarKanjis,
} from "@/kanji-worker/kanji-worker-hooks";
import { recognizeWithDaKanji } from "@/components/screens/ListScreen/ControlBar/SearchInput/HandwritingScreen/recognizers";
import { ClozeWord } from "./ClozeWord";
import { buildCandidateGrid } from "./build-candidates";
import { DRAW_SVG_SIZE } from "./constants";
import { SelectSimilarKanjiDrawer } from "./drawers/SelectSimilarKanjiDrawer";
import { FeedbackDrawer } from "./drawers/FeedbackDrawer";
import {
  DrawingSnapshot,
  GradeRankInfo,
  PracticeItem,
  ProductionPracticeSettings,
  SessionResult,
} from "./types";

type CardStep =
  | { type: "draw" }
  | { type: "recognizing" }
  | {
      type: "select";
      grade: GradeRankInfo;
      candidates: string[];
    }
  | {
      type: "feedback";
      kind: "noKanji" | "correct" | "incorrect";
      grade: GradeRankInfo;
    };

export const Game = ({
  sessionItems,
  settings,
  randomKanjiPool,
  onProgress,
  onComplete,
  onEnd,
}: {
  sessionItems: PracticeItem[];
  settings: ProductionPracticeSettings;
  randomKanjiPool: string[];
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
  const padSize = useFitPadSize(DRAW_SVG_SIZE);

  const current = sessionItems[index];
  const similarState = useSimilarKanjis(current?.kanji ?? "");
  const similars = similarState.data ?? [];
  const getKanjiInfo = useGetKanjiInfoFn();
  const speak = useSpeak(current?.word ?? "");
  const playCorrect = useCorrectSound();

  useEffect(() => {
    setStrokes([]);
    setDrawing(null);
    setStep({ type: "draw" });
    setSelected(null);
  }, [index]);

  useEffect(() => {
    setStrokes([]);
    setDrawing(null);
  }, [padSize]);

  useEffect(() => {
    onProgress(
      sessionItems.length === 0 ? 0 : (index / sessionItems.length) * 100
    );
  }, [index, onProgress, sessionItems.length]);

  useEffect(() => {
    if (!current || !settings.hearPronunciationOnLoad) return;
    if (step.type !== "draw") return;
    speak();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- speak on card load only
  }, [index, settings.hearPronunciationOnLoad]);

  // Enter/Space grades when there are strokes. Never Forgot via keyboard.
  useEffect(() => {
    if (step.type !== "draw" || strokes.length === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key !== "Enter" && e.key !== " ") || e.isComposing) return;
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (el.isContentEditable) return;
      e.preventDefault();
      drawSubmitRef.current({
        strokes,
        width: padSize,
        height: padSize,
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step.type, strokes, padSize]);

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
    setIndex(nextIndex);
  };

  const onForgotFromDraw = () => {
    if (step.type !== "draw") return;
    pushResult(false, -1);
    setStep({
      type: "feedback",
      kind: "noKanji",
      grade: { rank: -1, topGuess: null, inTop10: false },
    });
  };

  const onSubmit = async (payload: DrawingSubmitPayload) => {
    if (step.type !== "draw" || payload.strokes.length === 0) return;
    setDrawing(payload);
    setStep({ type: "recognizing" });
    try {
      const candidates = await recognizeWithDaKanji(payload);
      const rank = candidates.indexOf(current.kanji);
      const inTop10 = rank >= 0;
      const grade: GradeRankInfo = {
        rank,
        topGuess: candidates[0] ?? null,
        inTop10,
      };
      const similarList = similarState.data ?? similars;
      // Require a kanji_main entry (jlpt). getKanjiInfo also returns radical
      // part-keywords (e.g. 囗 → "closed box"), which must not count.
      const isRealKanji = (k: string) => getKanjiInfo?.(k)?.jlpt != null;
      const grid = buildCandidateGrid({
        target: current.kanji,
        inTop10,
        modelGuesses: candidates,
        similars: similarList,
        randomPool: randomKanjiPool,
        isRealKanji,
      });
      setSelected(null);
      setStep({ type: "select", grade, candidates: grid });
    } catch {
      setStep({ type: "draw" });
    }
  };

  drawSubmitRef.current = onSubmit;

  const onSelectForgot = () => {
    if (step.type !== "select") return;
    pushResult(false, step.grade.rank);
    setStep({ type: "feedback", kind: "incorrect", grade: step.grade });
  };

  const onSelectNext = () => {
    if (step.type !== "select" || selected == null) return;
    const pickedCorrect = selected === current.kanji;
    const sessionCorrect = pickedCorrect && step.grade.inTop10;
    if (sessionCorrect) {
      playCorrect({ enabled: settings.celebratorySoundOnCorrect });
    }
    pushResult(sessionCorrect, step.grade.rank);
    setStep({
      type: "feedback",
      kind: pickedCorrect ? "correct" : "incorrect",
      grade: step.grade,
    });
  };

  const recognizing = step.type === "recognizing";
  const selectOpen = step.type === "select";
  const feedback = step.type === "feedback" ? step : null;

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden">
      <EndSession onClick={onEnd} />

      <div className="flex flex-col items-center flex-1 min-h-0 px-3 pt-8 pb-2 overflow-y-auto sm:px-4">
        <ClozeWord
          word={current.word}
          kanji={current.kanji}
          fontIndex={current.fontIndex}
          revealed={feedback != null}
        />

        <div className="flex flex-wrap items-center justify-center gap-1 mt-3">
          {current.reading.split("・").map((r) => (
            <RomajiBadge key={r} kana={r} />
          ))}
          <SpeakButton word={current.word} iconType="volume-2" />
        </div>

        <BlurredGloss
          text={current.englishGloss}
          resetKey={index}
          blurrable={settings.blurEnglishGloss}
          className="mt-2"
        />

        <div
          className="relative w-full mx-auto mt-2"
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
                Recognizing…
              </p>
            </div>
          )}
        </div>
      </div>

      <SelectSimilarKanjiDrawer
        open={selectOpen}
        grade={
          step.type === "select"
            ? step.grade
            : { rank: -1, topGuess: null, inTop10: false }
        }
        candidates={step.type === "select" ? step.candidates : []}
        selected={selected}
        onSelect={setSelected}
        onForgot={onSelectForgot}
        onNext={onSelectNext}
      />

      <FeedbackDrawer
        open={feedback != null}
        kind={feedback?.kind ?? "noKanji"}
        item={current}
        grade={feedback?.grade ?? { rank: -1, topGuess: null, inTop10: false }}
        drawing={drawing}
        onNext={advance}
      />
    </div>
  );
};
