import { useEngineQuery } from "@/lib/engine/use-engine-query";
import { DateRange, daysInRange } from "@/lib/activity";

/** All-time totals, active-day counts and the first-attempt dates. */
export const useAllTimeSummary = () =>
  useEngineQuery("activity.watchAllTime", (api) => api.activity.watchAllTime());

/** One summary per day of `range` (days without activity may be absent). */
export const useDailySummaries = (range: DateRange) => {
  const totalDays = daysInRange(range);
  return useEngineQuery(
    `activity.watchDailySummaries:${range.start}:${totalDays}`,
    (api) => api.activity.watchDailySummaries({ from: range.start, totalDays })
  );
};
