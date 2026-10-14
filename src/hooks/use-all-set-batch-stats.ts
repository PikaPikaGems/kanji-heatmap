import { combineQueryStores } from "@/lib/engine/combine-query-stores";
import { getCachedStore, snapshotValue } from "@/lib/engine/store-cache";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import { fillTheKanjiActivityType } from "@/lib/fill-the-kanji/activity";
import {
  AllSetBatchStats,
  toSetBatchStats,
} from "@/lib/fill-the-kanji/progress";
import { FILL_THE_KANJI_SETS } from "@/lib/fill-the-kanji/sets";

const ALL_SETS_KEY = "activity.watchAllGenericChallenges:fill_the_kanji_*";

/**
 * Every Fill the Kanji set's per-batch stats from the engine, or null when
 * they aren't available (loading, logged out, no engine, or a failed read).
 * Each set is one `activity.watchAllGenericChallenges(activityType)` watch,
 * combined into one query so views over all sets need no hook per set.
 */
export const useAllSetBatchStats = (): AllSetBatchStats | null => {
  const snapshot = useEngineQuery(ALL_SETS_KEY, (api) =>
    combineQueryStores(
      FILL_THE_KANJI_SETS.map(({ id }) => {
        const activityType = fillTheKanjiActivityType(id);
        return getCachedStore(
          api,
          `activity.watchAllGenericChallenges:${activityType}`,
          (a) => a.activity.watchAllGenericChallenges(activityType)
        );
      })
    )
  );
  const perSet = snapshotValue(snapshot);
  if (!perSet) return null;
  return new Map(
    FILL_THE_KANJI_SETS.map(
      ({ id }, i) => [id, toSetBatchStats(perSet[i])] as const
    )
  );
};
