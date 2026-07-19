import {
  ACTIVITY_ALL_TIME_KEY,
  ACTIVITY_BY_DAY_KEY,
  ActivityByDay,
  AllTimeActivity,
  countAllDaysActive,
  readActivityByDay,
  readAllTimeActivity,
} from "@/lib/activity";
import { useStorageValue } from "./use-storage-value";

const readSnapshot = () => {
  const byDay = readActivityByDay();
  return {
    allTime: readAllTimeActivity(),
    byDay,
    ...countAllDaysActive(byDay),
  };
};

/**
 * Reactive all-time + by-day activity. Re-reads on storage events for the
 * activity keys (same-tab via notifyStorage, cross-tab via the browser).
 */
export const useActivityData = () => {
  const data = useStorageValue(
    readSnapshot,
    (key) =>
      key == null ||
      key === ACTIVITY_ALL_TIME_KEY ||
      key === ACTIVITY_BY_DAY_KEY
  );

  return data as {
    allTime: AllTimeActivity;
    byDay: ActivityByDay;
    daysActive: number;
    speedKatakanaDays: number;
    productionDays: number;
    recognitionDays: number;
  };
};
