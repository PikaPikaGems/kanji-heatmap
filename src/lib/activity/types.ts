import {
  productionPracticePageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/components/items/practice-pages";

export type ActivityKind = "speedKatakana" | "production" | "recognition";

export type AllTimeActivity = {
  /** YYYY-MM-DD of first recorded event (local). */
  cakeDay: string | null;
  speedKatakanaSessions: number;
  productionRounds: number;
  recognitionRounds: number;
};

export type DayCounts = {
  speedKatakana: number;
  production: number;
  recognition: number;
};

/** Map of local YYYY-MM-DD → per-kind event counts. */
export type ActivityByDay = Record<string, DayCounts>;

export type DateRange = {
  start: string; // inclusive YYYY-MM-DD
  end: string; // inclusive YYYY-MM-DD
};

export type DurationOption =
  | { type: "last365" }
  | { type: "year"; year: number };

export type ActivityKindFilters = Record<ActivityKind, boolean>;

export type WindowedActivityStats = {
  daysActive: number;
  speedKatakanaSessions: number;
  productionRounds: number;
  recognitionRounds: number;
};

export const EMPTY_DAY_COUNTS: DayCounts = {
  speedKatakana: 0,
  production: 0,
  recognition: 0,
};

export const EMPTY_ALL_TIME: AllTimeActivity = {
  cakeDay: null,
  speedKatakanaSessions: 0,
  productionRounds: 0,
  recognitionRounds: 0,
};

export const DEFAULT_KIND_FILTERS: ActivityKindFilters = {
  speedKatakana: true,
  production: true,
  recognition: true,
};

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  speedKatakana: speedKatakanaPageMeta.shortLabel,
  production: productionPracticePageMeta.shortLabel,
  recognition: recognitionPracticePageMeta.shortLabel,
};

export const ALL_ACTIVITY_KINDS: ActivityKind[] = [
  "speedKatakana",
  "production",
  "recognition",
];
