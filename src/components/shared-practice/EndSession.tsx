import { useMemo } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { useEnterAction } from "@/hooks/use-enter-action";
import { pickEndCheer } from "@/lib/practice-cheers";
import { percent } from "@/lib/utils";
import { Stat } from "./CountUpStat";
import { EndScreenLayout } from "./EndScreenLayout";
import { PracticeSessionResult } from "./types";
import { RecapTile } from "./RecapTile";

const CONTINUE_KEYS = ["Enter", " "] as const;

export const EndSession = ({
  results,
  hasMore,
  wordsCleared,
  onNext,
  onEnd,
}: {
  results: PracticeSessionResult[];
  /** False when every word in the deck has been answered correctly. */
  hasMore: boolean;
  /** Total words in the filtered deck (used on the final complete screen). */
  wordsCleared: number;
  onNext: () => void;
  onEnd: () => void;
}) => {
  const cheer = useMemo(() => pickEndCheer(), []);
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = percent(correctCount, results.length, 100);

  useEnterAction(hasMore ? onNext : onEnd, true, CONTINUE_KEYS);
  useEnterAction(onEnd, true, ["Escape"]);

  if (!hasMore) {
    return (
      <EndScreenLayout
        className="px-4"
        heading={`🎉 ${cheer}`}
        subtitle="All words complete"
        stats={
          <>
            <Stat value={accuracy} unit="%" label="Accuracy" />
            <Stat value={wordsCleared} unit="" label="Words cleared" />
            <Stat value={results.length} unit="" label="Attempts" />
          </>
        }
        primaryLabel="Done"
        onPrimary={onEnd}
      />
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
