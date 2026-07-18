import { Label } from "@/components/ui/label";
import { FreqCategory, freqCategoryCn } from "@/lib/freq/freq-category";
import { readSetStats } from "./storage";
import {
  CHALLENGES_PER_LEVEL,
  LEVELS,
  levelOf,
  positionInLevel,
  setFromLevelAndPos,
} from "./constants";

/**
 * The level grid + challenge grid used to pick a challenge set. Level squares
 * are shaded by how much of the level is done; challenge squares by whether
 * that set has recorded stats.
 */
export const ChallengeSetSelector = ({
  challengeSet,
  levelCompletion,
  onSelect,
}: {
  challengeSet: number;
  levelCompletion: number[];
  onSelect: (setNumber: number) => void;
}) => {
  const currentLevel = levelOf(challengeSet);
  const currentPos = positionInLevel(challengeSet);
  const currentLevelDone = levelCompletion[currentLevel - 1];

  const selectLevel = (level: number) => {
    // Keep the position when re-selecting the current level; jump to the
    // first challenge when moving to a different one.
    const pos = levelOf(challengeSet) === level ? currentPos : 1;
    onSelect(setFromLevelAndPos(level, pos));
  };

  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Select a Challenge Set</Label>
        <span className="text-sm font-semibold tabular-nums">
          {(currentLevelDone / CHALLENGES_PER_LEVEL) * 100}% done
        </span>
      </div>

      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: LEVELS }, (_, i) => i + 1).map((level) => {
          const doneCount = levelCompletion[level - 1];
          const category = Math.round(
            (doneCount / CHALLENGES_PER_LEVEL) * 4
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
      <Label className="text-sm text-left">Select a Challenge</Label>

      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: CHALLENGES_PER_LEVEL }, (_, i) => i + 1).map(
          (pos) => {
            const setNum = setFromLevelAndPos(currentLevel, pos);
            const completed = !!readSetStats(setNum);
            const bgCn = completed ? freqCategoryCn[4] : freqCategoryCn[0];
            const textCn = completed ? "text-white" : "text-foreground";
            return (
              <button
                key={pos}
                onClick={() => onSelect(setNum)}
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

      <p className="text-xs text-left">
        Lower challenges contain more common words.
      </p>
    </div>
  );
};
