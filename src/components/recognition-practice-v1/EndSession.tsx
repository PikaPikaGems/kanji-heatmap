import { useMemo } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { useEnterAction } from "@/hooks/use-enter-action";
import { pickEndCheer } from "@/lib/practice-cheers";
import { SessionResult } from "./types";
import { RecapTile } from "./RecapTile";

export const EndSession = ({
  results,
  onNext,
  onEnd,
}: {
  results: SessionResult[];
  onNext: () => void;
  onEnd: () => void;
}) => {
  const cheer = useMemo(() => pickEndCheer(), []);
  useEnterAction(onNext);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 min-h-0 px-4 pt-4 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-center kanji-font animate-practice-bounce-soft">
            🎉 {cheer}
          </h2>
          <div className="flex flex-wrap justify-center gap-2 pb-4 mt-6">
            {results.map((item, i) => (
              <div
                key={`${item.kanji}-${item.word}`}
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
