import { safeReadJson } from "@/lib/storage";
import { ActivityByDay, AllTimeActivity, EMPTY_ALL_TIME } from "./types";

export const ACTIVITY_ALL_TIME_KEY = "activity-all-time";
export const ACTIVITY_BY_DAY_KEY = "activity-by-day";

export const readAllTimeActivity = (): AllTimeActivity =>
  safeReadJson(ACTIVITY_ALL_TIME_KEY, EMPTY_ALL_TIME);

export const readActivityByDay = (): ActivityByDay =>
  safeReadJson(ACTIVITY_BY_DAY_KEY, {});
