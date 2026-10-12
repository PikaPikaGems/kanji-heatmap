import { Label } from "@/components/ui/label";
import { FreqCategory, freqCategoryCn } from "@/lib/freq/freq-category";

/**
 * Level grid + item grid for picking one item inside numbered levels (speed
 * katakana challenge sets, fill-the-kanji batches). Level squares are shaded by
 * how much of the level is done; item squares by whether that item is done.
 * Re-selecting the current level keeps the position; another level jumps to
 * its first item.
 */
export const LevelGridSelector = ({
  levelCount,
  itemsPerLevel,
  levelSize = () => itemsPerLevel,
  isDone,
  level: currentLevel,
  position: currentPos,
  onSelect,
  levelHeading,
  itemHeading,
  footnote,
}: {
  levelCount: number;
  /** Columns in the item grid (and the size of a full level). */
  itemsPerLevel: number;
  /** Items in a given level, when the last level can be shorter. */
  levelSize?: (level: number) => number;
  isDone: (level: number, position: number) => boolean;
  level: number;
  position: number;
  onSelect: (level: number, position: number) => void;
  levelHeading: string;
  itemHeading: string;
  footnote?: string;
}) => {
  const doneInLevel = (level: number) => {
    let done = 0;
    for (let pos = 1; pos <= levelSize(level); pos++) {
      if (isDone(level, pos)) done++;
    }
    return done;
  };

  const currentLevelSize = levelSize(currentLevel);

  const selectLevel = (level: number) => {
    // Keep the position when re-selecting the current level; jump to the
    // first item when moving to a different one.
    const pos = currentLevel === level ? currentPos : 1;
    onSelect(level, pos);
  };

  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{levelHeading}</Label>
        <span className="text-sm font-semibold tabular-nums">
          {Math.round((doneInLevel(currentLevel) / currentLevelSize) * 100)}%
          done
        </span>
      </div>

      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: levelCount }, (_, i) => i + 1).map((level) => {
          const category = Math.round(
            (doneInLevel(level) / levelSize(level)) * 4
          ) as FreqCategory;
          const bgCn = freqCategoryCn[category];
          const textCn = category > 3 ? "text-white" : "text-foreground";
          return (
            <button
              key={level}
              onClick={() => selectLevel(level)}
              className={`py-1 ${bgCn} ${textCn} hover:opacity-80 text-xs rounded font-bold transition-colors border-2 ${
                currentLevel === level ? "border-primary" : ""
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>
      <Label className="pt-3 text-sm text-left">{itemHeading}</Label>

      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: currentLevelSize }, (_, i) => i + 1).map(
          (pos) => {
            const completed = isDone(currentLevel, pos);
            const bgCn = completed ? freqCategoryCn[4] : freqCategoryCn[0];
            const textCn = completed ? "text-white" : "text-foreground";
            return (
              <button
                key={pos}
                onClick={() => onSelect(currentLevel, pos)}
                className={`py-1 ${bgCn} ${textCn} hover:opacity-80 text-xs rounded font-bold transition-colors border-2 ${
                  currentPos === pos ? "border-primary" : ""
                }`}
              >
                {pos}
              </button>
            );
          }
        )}
      </div>

      {footnote && <p className="text-xs text-left">{footnote}</p>}
    </div>
  );
};
