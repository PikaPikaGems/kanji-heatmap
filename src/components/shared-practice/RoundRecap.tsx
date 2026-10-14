import { ReactNode } from "react";
import type { FsrsRating } from "engine-contract";
import { PracticeButton } from "@/components/ui/practice-button";
import { RecapTile } from "./RecapTile";

export type RoundRecapTile = {
  kanji: string;
  keyword: string;
  correct: boolean;
  /** Mastery game: the rating the card got, shown as the tile border. */
  rating?: FsrsRating;
};

/**
 * End-of-round screen shared by the practice and mastery games: cheer, a
 * summary line, the round's kanji as tiles, then Continue / End Session.
 */
export const RoundRecap = ({
  cheer,
  summary,
  tiles,
  afterTiles,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  cheer: string;
  /** Shown under the cheer, e.g. "7/10 correct this round". */
  summary: ReactNode;
  tiles: RoundRecapTile[];
  /** Shown under the tiles, e.g. a "progress not saved" notice. */
  afterTiles?: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) => (
  <div className="flex flex-col w-full h-full">
    <div className="flex-1 min-h-0 px-4 pt-4 overflow-y-auto">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center kanji-font animate-practice-bounce-soft">
          🎉 {cheer}
        </h2>
        {summary}

        <div className="flex flex-wrap justify-center gap-2 pb-4 mt-6">
          {tiles.map((item, i) => (
            <div
              key={`${item.kanji}-${i}`}
              className="animate-practice-tile-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <RecapTile
                kanji={item.kanji}
                keyword={item.keyword}
                correct={item.correct}
                rating={item.rating}
              />
            </div>
          ))}
        </div>
        {afterTiles}
      </div>
    </div>

    <div className="shrink-0 px-4 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background">
      <div className="flex flex-col w-full max-w-md gap-2 mx-auto">
        <PracticeButton size="lg" onClick={onPrimary}>
          {primaryLabel}
        </PracticeButton>
        {secondaryLabel && onSecondary && (
          <PracticeButton size="md" variant="ghost" onClick={onSecondary}>
            {secondaryLabel}
          </PracticeButton>
        )}
      </div>
    </div>
  </div>
);
