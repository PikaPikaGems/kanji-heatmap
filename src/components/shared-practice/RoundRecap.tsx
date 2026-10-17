import type { FsrsRating } from "engine-contract";
import { ReactNode } from "react";
import { EndScreenLayout } from "./EndScreenLayout";
import { RecapTile } from "./RecapTile";

export type RoundRecapTile = {
  kanji: string;
  keyword: string;
  correct: boolean;
  /** Mastery game: the rating the card got, shown as the tile border. */
  rating?: FsrsRating;
};

/**
 * End-of-round screen shared by the practice and mastery games: the shared
 * end screen with the round's kanji as tiles.
 */
export const RoundRecap = ({
  cheer,
  subtitle,
  tiles,
  onContinue,
  onEnd,
  notice,
}: {
  cheer: string;
  /** Shown under the cheer, e.g. "7/10 correct this round". */
  subtitle: string;
  tiles: RoundRecapTile[];
  onContinue?: () => void;
  onEnd: () => void;
  /** Under the buttons, e.g. a "progress not saved" notice. */
  notice?: ReactNode;
}) => (
  <EndScreenLayout
    cheer={cheer}
    subtitle={subtitle}
    onContinue={onContinue}
    onEnd={onEnd}
    notice={notice}
  >
    <div className="flex flex-wrap justify-center gap-2">
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
  </EndScreenLayout>
);
