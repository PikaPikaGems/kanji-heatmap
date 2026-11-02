import type { FreqCategory } from "@/lib/freq/freq-category";
import { isDateKeyInRange } from "./dates";
import {
  ActivityByDay,
  ActivityKind,
  ActivityKindFilters,
  ActivityStats,
  ALL_ACTIVITY_KINDS,
  DateRange,
  DayCounts,
  EMPTY_DAY_COUNTS,
} from "./types";

export const emptyActivityStats = (): ActivityStats => ({
  daysActive: 0,
  kinds: Object.fromEntries(
    ALL_ACTIVITY_KINDS.map((kind) => [kind, { days: 0, count: 0 }])
  ) as ActivityStats["kinds"],
});

export const dayTotalForFilters = (
  day: DayCounts | undefined,
  filters: ActivityKindFilters
): number => {
  if (!day) return 0;
  let total = 0;
  for (const kind of ALL_ACTIVITY_KINDS) {
    if (filters[kind]) total += day[kind];
  }
  return total;
};

export const summarizeActivityInRange = (
  byDay: ActivityByDay,
  range: DateRange,
  filters: ActivityKindFilters
): ActivityStats => {
  const stats = emptyActivityStats();

  for (const [key, day] of Object.entries(byDay)) {
    if (!isDateKeyInRange(key, range)) continue;

    for (const kind of enabledKinds(filters)) {
      const count = day[kind];
      if (count <= 0) continue;
      stats.kinds[kind].count += count;
      stats.kinds[kind].days += 1;
    }

    if (dayTotalForFilters(day, filters) > 0) stats.daysActive += 1;
  }

  return stats;
};

export const maxDayTotalInRange = (
  byDay: ActivityByDay,
  range: DateRange,
  filters: ActivityKindFilters
): number => {
  let max = 0;
  for (const [key, day] of Object.entries(byDay)) {
    if (!isDateKeyInRange(key, range)) continue;
    max = Math.max(max, dayTotalForFilters(day, filters));
  }
  return max;
};

/**
 * Relative intensity vs the busiest day in range (maxN).
 * A day with n === maxN is always painted at maximum brightness.
 */
export const getActivityLevel = (n: number, maxN: number): FreqCategory => {
  if (n <= 0 || maxN <= 0) return 0;
  if (n <= maxN * 0.25) return 1;
  if (n <= maxN * 0.5) return 2;
  if (n <= maxN * 0.75) return 3;
  return 4;
};

export const getDayCounts = (
  byDay: ActivityByDay,
  dateKey: string
): DayCounts => byDay[dateKey] ?? EMPTY_DAY_COUNTS;

export const enabledKinds = (filters: ActivityKindFilters): ActivityKind[] =>
  ALL_ACTIVITY_KINDS.filter((k) => filters[k]);
