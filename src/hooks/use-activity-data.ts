import { useEffect, useState } from "react";
import {
  ACTIVITY_ALL_TIME_KEY,
  ACTIVITY_BY_DAY_KEY,
  ActivityByDay,
  AllTimeActivity,
  countAllDaysActive,
  readActivityByDay,
  readAllTimeActivity,
} from "@/lib/activity";

const readSnapshot = () => ({
  allTime: readAllTimeActivity(),
  byDay: readActivityByDay(),
  daysActive: countAllDaysActive(readActivityByDay()),
});

/**
 * Reactive all-time + by-day activity. Re-reads on storage events for the
 * activity keys (same-tab via notifyStorage, cross-tab via the browser).
 */
export const useActivityData = () => {
  const [data, setData] = useState(() => readSnapshot());

  useEffect(() => {
    const refresh = () => setData(readSnapshot());
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === ACTIVITY_ALL_TIME_KEY ||
        e.key === ACTIVITY_BY_DAY_KEY ||
        e.key == null
      ) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return data as {
    allTime: AllTimeActivity;
    byDay: ActivityByDay;
    daysActive: number;
  };
};
