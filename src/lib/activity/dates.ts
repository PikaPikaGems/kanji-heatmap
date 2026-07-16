import type { DateRange, DurationOption } from "./types";

/** Local calendar date as YYYY-MM-DD. */
export const toLocalDateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** Parse YYYY-MM-DD as a local midnight Date. */
export const parseLocalDateKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const compareDateKeys = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

export const isDateKeyInRange = (key: string, range: DateRange): boolean =>
  key >= range.start && key <= range.end;

export const getDurationRange = (
  option: DurationOption,
  today: Date = new Date()
): DateRange => {
  if (option.type === "year") {
    return {
      start: `${option.year}-01-01`,
      end: `${option.year}-12-31`,
    };
  }
  const end = toLocalDateKey(today);
  const startDate = addDays(today, -364);
  return { start: toLocalDateKey(startDate), end };
};

/** Older → newer periods for the duration picker (prev/next do not wrap). */
export const getDurationOptions = (
  today: Date = new Date()
): DurationOption[] => {
  const year = today.getFullYear();
  return [
    { type: "year", year: year - 1 },
    { type: "year", year },
    { type: "last365" },
  ];
};

const sameDurationOption = (a: DurationOption, b: DurationOption): boolean => {
  if (a.type === "last365" && b.type === "last365") return true;
  if (a.type === "year" && b.type === "year") return a.year === b.year;
  return false;
};

const durationOptionIndex = (
  option: DurationOption,
  today: Date = new Date()
): number => {
  const index = getDurationOptions(today).findIndex((opt) =>
    sameDurationOption(opt, option)
  );
  return Math.max(0, index);
};

export const canGoPrevDuration = (
  option: DurationOption,
  today: Date = new Date()
): boolean => durationOptionIndex(option, today) > 0;

export const canGoNextDuration = (
  option: DurationOption,
  today: Date = new Date()
): boolean => {
  const options = getDurationOptions(today);
  return durationOptionIndex(option, today) < options.length - 1;
};

/** Move one step older (-1) or newer (1). Returns null at the ends. */
export const shiftDuration = (
  option: DurationOption,
  delta: -1 | 1,
  today: Date = new Date()
): DurationOption | null => {
  const options = getDurationOptions(today);
  const next = durationOptionIndex(option, today) + delta;
  if (next < 0 || next >= options.length) return null;
  return options[next];
};

export const durationOptionLabel = (option: DurationOption): string => {
  if (option.type === "last365") return "Last 365 days";
  return String(option.year);
};

export const durationOptionKey = (option: DurationOption): string => {
  if (option.type === "last365") return "last365";
  return `year-${option.year}`;
};

export const parseDurationOptionKey = (key: string): DurationOption => {
  if (key === "last365") return { type: "last365" };
  const year = Number(key.replace("year-", ""));
  return {
    type: "year",
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
  };
};

/** Format YYYY-MM-DD like "May 2, 2026". */
export const formatCakeDay = (key: string): string => {
  const date = parseLocalDateKey(key);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

/** Short date for calendar tooltips, e.g. "May 2, 2026". */
export const formatActivityDay = (key: string): string => formatCakeDay(key);

/**
 * Build Sunday-start week columns covering `range`.
 * Each column is 7 slots (Sun→Sat); null = outside the selected range.
 */
export const buildCalendarWeeks = (range: DateRange): (string | null)[][] => {
  const start = parseLocalDateKey(range.start);
  const end = parseLocalDateKey(range.end);

  // Align to Sunday on or before start.
  const gridStart = addDays(start, -start.getDay());
  // Align to Saturday on or after end.
  const gridEnd = addDays(end, 6 - end.getDay());

  const weeks: (string | null)[][] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    const week: (string | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const key = toLocalDateKey(cursor);
      week.push(isDateKeyInRange(key, range) ? key : null);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  return weeks;
};

/** Month label positions for calendar header (week index → single letter). */
export const monthLabelsForWeeks = (
  weeks: (string | null)[][]
): { weekIndex: number; label: string }[] => {
  const labels: { weekIndex: number; label: string }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    const firstInRange = week.find((d) => d != null);
    if (!firstInRange) return;
    const date = parseLocalDateKey(firstInRange);
    const month = date.getMonth();
    if (month !== lastMonth) {
      // Cursor/GitHub-compact: single letter (J F M A M J J A S O N D)
      const letter = date.toLocaleDateString("en-US", { month: "short" })[0];
      labels.push({ weekIndex, label: letter });
      lastMonth = month;
    }
  });

  return labels;
};
