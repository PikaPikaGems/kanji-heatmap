import { LevelGridSelector } from "@/components/shared-practice/LevelGridSelector";
import type { AllChallengeSetStats } from "@/lib/speed-katakana/stats";
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
  allStats,
  onSelect,
}: {
  challengeSet: number;
  /** Null when progress isn't available (logged out, loading). */
  allStats: AllChallengeSetStats | null;
  onSelect: (setNumber: number) => void;
}) => (
  <LevelGridSelector
    levelCount={LEVELS}
    itemsPerLevel={CHALLENGES_PER_LEVEL}
    isDone={(level, pos) =>
      allStats?.has(setFromLevelAndPos(level, pos)) ?? false
    }
    level={levelOf(challengeSet)}
    position={positionInLevel(challengeSet)}
    onSelect={(level, pos) => onSelect(setFromLevelAndPos(level, pos))}
    levelHeading="Select a Challenge Set"
    itemHeading="Select a Challenge"
    footnote="Lower challenges contain more common words."
  />
);
