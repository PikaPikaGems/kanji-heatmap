import {
  fillTheKanjiPageMeta,
  productionPracticePageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/lib/pages/practice-pages";

export type ActivityKind =
  | "speedKatakana"
  | "production"
  | "recognition"
  | "fillTheKanji";

export type AllTimeActivity = {
  /** YYYY-MM-DD of first recorded event (local). */
  cakeDay: string | null;
  speedKatakanaSessions: number;
  productionRounds: number;
  recognitionRounds: number;
  /** Optional: stored records from before Fill the Kanji existed lack it. */
  fillTheKanjiRounds?: number;
};

export type DayCounts = {
  speedKatakana: number;
  production: number;
  recognition: number;
  /** Optional: days recorded before Fill the Kanji existed lack it. */
  fillTheKanji?: number;
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
  speedKatakanaDays: number;
  productionDays: number;
  recognitionDays: number;
  fillTheKanjiDays: number;
  speedKatakanaSessions: number;
  productionRounds: number;
  recognitionRounds: number;
  fillTheKanjiRounds: number;
};

export const EMPTY_DAY_COUNTS: DayCounts = {
  speedKatakana: 0,
  production: 0,
  recognition: 0,
  fillTheKanji: 0,
};

export const EMPTY_ALL_TIME: AllTimeActivity = {
  cakeDay: null,
  speedKatakanaSessions: 0,
  productionRounds: 0,
  recognitionRounds: 0,
  fillTheKanjiRounds: 0,
};

export const DEFAULT_KIND_FILTERS: ActivityKindFilters = {
  speedKatakana: true,
  production: true,
  recognition: true,
  fillTheKanji: true,
};

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  speedKatakana: speedKatakanaPageMeta.shortLabel,
  production: productionPracticePageMeta.shortLabel,
  recognition: recognitionPracticePageMeta.shortLabel,
  fillTheKanji: fillTheKanjiPageMeta.shortLabel,
};

export const ALL_ACTIVITY_KINDS: ActivityKind[] = [
  "recognition",
  "production",
  "fillTheKanji",
  "speedKatakana",
];
