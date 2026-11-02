import type { LocalDate } from "engine-contract";

const dayStart = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "today", "yesterday", or a short local date like "Oct 3, 2026". */
const formatDay = (date: Date, now: Date) => {
  const days = Math.round((dayStart(now) - dayStart(date)) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/** "today", "yesterday", or a short date, for an engine "YYYY-MM-DD" day. */
export const formatLastAttemptedDay = (day: LocalDate, now = new Date()) => {
  const [year, month, date] = day.split("-").map(Number);
  return formatDay(new Date(year, month - 1, date), now);
};
