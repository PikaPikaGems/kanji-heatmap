import { useMemo } from "react";
import { computeAverageCpm, countCompletedSets, readSetStats } from "./storage";
import {
  CHALLENGES_PER_LEVEL,
  LEVELS,
  setFromLevelAndPos,
  SPEED_KATAKANA_TOTAL_CHALLENGES,
} from "./constants";

/**
 * Aggregates stored challenge stats for the initial screen: the overall
 * summary (sets completed + average speed) and how many challenges are done
 * per level. Read once on mount — the initial screen remounts between games.
 */
export const useSpeedKatakanaProgress = () => {
  const summary = useMemo(
    () => ({
      completed: countCompletedSets(SPEED_KATAKANA_TOTAL_CHALLENGES),
      averageCpm: computeAverageCpm(SPEED_KATAKANA_TOTAL_CHALLENGES),
    }),
    []
  );

  const levelCompletion = useMemo(() => {
    const counts: number[] = [];
    for (let level = 1; level <= LEVELS; level++) {
      let count = 0;
      for (let pos = 1; pos <= CHALLENGES_PER_LEVEL; pos++) {
        if (readSetStats(setFromLevelAndPos(level, pos))) count++;
      }
      counts.push(count);
    }
    return counts;
  }, []);

  return { summary, levelCompletion };
};
