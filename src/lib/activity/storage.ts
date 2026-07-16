import { notifyStorage, safeReadJson } from "@/lib/storage";
import {
  ActivityByDay,
  ActivityKind,
  AllTimeActivity,
  DayCounts,
  EMPTY_ALL_TIME,
  EMPTY_DAY_COUNTS,
} from "./types";
import { toLocalDateKey } from "./dates";

export const ACTIVITY_ALL_TIME_KEY = "activity-all-time";
export const ACTIVITY_BY_DAY_KEY = "activity-by-day";

const kindToAllTimeField: Record<
  ActivityKind,
  keyof Omit<AllTimeActivity, "cakeDay">
> = {
  speedKatakana: "speedKatakanaSessions",
  production: "productionRounds",
  recognition: "recognitionRounds",
};

export const readAllTimeActivity = (): AllTimeActivity =>
  safeReadJson(ACTIVITY_ALL_TIME_KEY, EMPTY_ALL_TIME);

export const readActivityByDay = (): ActivityByDay =>
  safeReadJson(ACTIVITY_BY_DAY_KEY, {});

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyStorage(key);
  } catch {
    // ignore storage write failures (e.g. private mode quota)
  }
};

/** Record one finished game event for today (local date). */
export const recordActivity = (
  kind: ActivityKind,
  at: Date = new Date()
): void => {
  const dateKey = toLocalDateKey(at);

  const allTime = readAllTimeActivity();
  const field = kindToAllTimeField[kind];
  const nextAllTime: AllTimeActivity = {
    ...allTime,
    cakeDay: allTime.cakeDay ?? dateKey,
    [field]: (allTime[field] ?? 0) + 1,
  };
  writeJson(ACTIVITY_ALL_TIME_KEY, nextAllTime);

  const byDay = readActivityByDay();
  const prevDay: DayCounts = byDay[dateKey] ?? { ...EMPTY_DAY_COUNTS };
  byDay[dateKey] = {
    ...prevDay,
    [kind]: (prevDay[kind] ?? 0) + 1,
  };
  writeJson(ACTIVITY_BY_DAY_KEY, byDay);
};
