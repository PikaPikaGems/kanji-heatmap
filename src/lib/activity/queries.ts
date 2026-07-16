import type { FreqCategory } from "@/lib/freq/freq-category";
import { isDateKeyInRange } from "./dates";
import {
  ActivityByDay,
  ActivityKind,
  ActivityKindFilters,
  ALL_ACTIVITY_KINDS,
  DateRange,
  DayCounts,
  EMPTY_DAY_COUNTS,
  WindowedActivityStats,
} from "./types";

export const dayTotalForFilters = (
  day: DayCounts | undefined,
  filters: ActivityKindFilters
): number => {
  if (!day) return 0;
  let total = 0;
  for (const kind of ALL_ACTIVITY_KINDS) {
    if (filters[kind]) total += day[kind] ?? 0;
  }
  return total;
};

export const summarizeActivityInRange = (
  byDay: ActivityByDay,
  range: DateRange,
  filters: ActivityKindFilters
): WindowedActivityStats => {
  let daysActive = 0;
  let speedKatakanaSessions = 0;
  let productionRounds = 0;
  let recognitionRounds = 0;

  for (const [key, day] of Object.entries(byDay)) {
    if (!isDateKeyInRange(key, range)) continue;

    if (filters.speedKatakana) {
      speedKatakanaSessions += day.speedKatakana ?? 0;
    }
    if (filters.production) {
      productionRounds += day.production ?? 0;
    }
    if (filters.recognition) {
      recognitionRounds += day.recognition ?? 0;
    }

    if (dayTotalForFilters(day, filters) > 0) daysActive += 1;
  }

  return {
    daysActive,
    speedKatakanaSessions,
    productionRounds,
    recognitionRounds,
  };
};

/** Distinct days with any activity (all kinds), for all-time overview. */
export const countAllDaysActive = (byDay: ActivityByDay): number => {
  let n = 0;
  for (const day of Object.values(byDay)) {
    if (
      (day.speedKatakana ?? 0) +
        (day.production ?? 0) +
        (day.recognition ?? 0) >
      0
    ) {
      n += 1;
    }
  }
  return n;
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

const INTENSITY_FLOOR = 4;

/**
 * GitHub-like relative intensity. Floors maxN so a lone single-event day
 * is not always painted at maximum brightness.
 */
export const getActivityLevel = (n: number, maxN: number): FreqCategory => {
  if (n <= 0) return 0;
  const scale = Math.max(maxN, INTENSITY_FLOOR);
  if (n <= scale * 0.25) return 1;
  if (n <= scale * 0.5) return 2;
  if (n <= scale * 0.75) return 3;
  return 4;
};

export const getDayCounts = (
  byDay: ActivityByDay,
  dateKey: string
): DayCounts => byDay[dateKey] ?? EMPTY_DAY_COUNTS;

export const enabledKinds = (filters: ActivityKindFilters): ActivityKind[] =>
  ALL_ACTIVITY_KINDS.filter((k) => filters[k]);
