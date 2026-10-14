import { snapshotValue } from "@/lib/engine/store-cache";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import {
  AllChallengeSetStats,
  toAllChallengeSetStats,
} from "@/lib/speed-katakana/stats";
import { useCoarsePointer } from "./use-coarse-pointer";

const ALL_CHALLENGES_KEY = "activity.watchAllSpeedKatakanaChallenges";

/**
 * Every attempted Speed Katakana set's stats from the engine, for this
 * device's pointer type (the type its sessions are recorded with), or null
 * when they aren't available (loading, logged out, no engine, or a failed read).
 */
export const useSpeedKatakanaStats = (): AllChallengeSetStats | null => {
  const isCoarsePointer = useCoarsePointer();
  const snapshot = useEngineQuery(ALL_CHALLENGES_KEY, (api) =>
    api.activity.watchAllSpeedKatakanaChallenges()
  );
  const summaries = snapshotValue(snapshot);
  if (!summaries) return null;
  return toAllChallengeSetStats(summaries, isCoarsePointer ? "coarse" : "fine");
};
