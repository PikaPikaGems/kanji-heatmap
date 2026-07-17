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
  let speedKatakanaDays = 0;
  let productionDays = 0;
  let recognitionDays = 0;
  let speedKatakanaSessions = 0;
  let productionRounds = 0;
  let recognitionRounds = 0;

  for (const [key, day] of Object.entries(byDay)) {
    if (!isDateKeyInRange(key, range)) continue;

    const speedKatakana = day.speedKatakana ?? 0;
    const production = day.production ?? 0;
    const recognition = day.recognition ?? 0;

    if (filters.speedKatakana) {
      speedKatakanaSessions += speedKatakana;
      if (speedKatakana > 0) speedKatakanaDays += 1;
    }
    if (filters.production) {
      productionRounds += production;
      if (production > 0) productionDays += 1;
    }
    if (filters.recognition) {
      recognitionRounds += recognition;
      if (recognition > 0) recognitionDays += 1;
    }

    if (dayTotalForFilters(day, filters) > 0) daysActive += 1;
  }

  return {
    daysActive,
    speedKatakanaDays,
    productionDays,
    recognitionDays,
    speedKatakanaSessions,
    productionRounds,
    recognitionRounds,
  };
};

/**
 * Distinct days with activity (all-time overview): total + per kind.
 */
export const countAllDaysActive = (
  byDay: ActivityByDay
): Pick<
  WindowedActivityStats,
  "daysActive" | "speedKatakanaDays" | "productionDays" | "recognitionDays"
> => {
  let daysActive = 0;
  let speedKatakanaDays = 0;
  let productionDays = 0;
  let recognitionDays = 0;

  for (const day of Object.values(byDay)) {
    const speedKatakana = day.speedKatakana ?? 0;
    const production = day.production ?? 0;
    const recognition = day.recognition ?? 0;

    if (speedKatakana > 0) speedKatakanaDays += 1;
    if (production > 0) productionDays += 1;
    if (recognition > 0) recognitionDays += 1;
    if (speedKatakana + production + recognition > 0) daysActive += 1;
  }

  return {
    daysActive,
    speedKatakanaDays,
    productionDays,
    recognitionDays,
  };
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
