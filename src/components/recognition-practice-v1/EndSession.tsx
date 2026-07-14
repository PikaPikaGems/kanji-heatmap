import { useEffect, useMemo, useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { useEnterAction } from "@/hooks/use-enter-action";
import { pickEndCheer } from "@/lib/practice-cheers";
import { SessionResult } from "./types";
import { RecapTile } from "./RecapTile";

const COUNT_UP_MS = 900;

const useCountUp = (target: number) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / COUNT_UP_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
};

const Stat = ({
  value,
  unit,
  label,
}: {
  value: number;
  unit: string;
  label: string;
}) => {
  const animated = useCountUp(value);
  return (
    <div className="flex flex-col items-center gap-1 animate-practice-tile-in">
      <div className="text-5xl font-bold tabular-nums sm:text-6xl">
        {animated}
        {unit ? (
          <span className="ml-1 text-2xl font-semibold text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
      <div className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </div>
    </div>
  );
};

export const EndSession = ({
  results,
  hasMore,
  wordsCleared,
  onNext,
  onEnd,
}: {
  results: SessionResult[];
  /** False when every word in the deck has been answered correctly. */
  hasMore: boolean;
  /** Total words in the filtered deck (used on the final complete screen). */
  wordsCleared: number;
  onNext: () => void;
  onEnd: () => void;
}) => {
  const cheer = useMemo(() => pickEndCheer(), []);
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy =
    results.length > 0
      ? Math.round((100 * correctCount) / results.length)
      : 100;

  useEnterAction(hasMore ? onNext : onEnd);

  if (!hasMore) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-10 px-4 animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-bold kanji-font animate-practice-bounce-soft">
            🎉 {cheer}
          </h2>
          <p className="mt-1 text-xs font-bold tracking-wide uppercase text-muted-foreground">
            All words complete
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center pb-4 gap-x-16 gap-y-8">
          <Stat value={accuracy} unit="%" label="Accuracy" />
          <Stat value={wordsCleared} unit="" label="Words cleared" />
          <Stat value={results.length} unit="" label="Attempts" />
        </div>

        <div className="flex flex-col w-full max-w-xs gap-3">
          <PracticeButton size="lg" onClick={onEnd}>
            Done
          </PracticeButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 min-h-0 px-4 pt-4 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-center kanji-font animate-practice-bounce-soft">
            🎉 {cheer}
          </h2>
          <p className="mt-2 text-sm font-bold text-center text-muted-foreground">
            {correctCount}/{results.length} correct this round
          </p>

          <div className="flex flex-wrap justify-center gap-2 pb-4 mt-6">
            {results.map((item, i) => (
              <div
                key={`${item.kanji}-${item.word}-${i}`}
                className="animate-practice-tile-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <RecapTile
                  kanji={item.kanji}
                  keyword={item.keyword}
                  correct={item.correct}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background">
        <div className="flex flex-col w-full max-w-md gap-2 mx-auto">
          <PracticeButton size="lg" onClick={onNext}>
            Continue
          </PracticeButton>
          <PracticeButton size="md" variant="ghost" onClick={onEnd}>
            End Session
          </PracticeButton>
        </div>
      </div>
    </div>
  );
};
