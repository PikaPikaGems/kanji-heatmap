import {
  fillTheKanjiPageMeta,
  productionPracticePageMeta,
  recognitionPractice2PageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/lib/pages/practice-pages";

export const READING_MASTERY_LABEL = "Kanji Reading Mastery I ⭐️";
export const READING_MASTERY_2_LABEL = "Kanji Reading Mastery II ⭐️";
export const WRITING_MASTERY_LABEL = "Kanji Writing Mastery ⭐️";

/**
 * What the activity heatmap counts. `recognition` / `recognition2` /
 * `production` are Reading Practice I / II and Writing Practice rounds (names
 * kept for saved filter settings); the mastery kinds count reviews graded in
 * the three mastery games, and `newKanji` the items added to the review pile.
 */
export type ActivityKind =
  | "speedKatakana"
  | "production"
  | "recognition"
  | "recognition2"
  | "fillTheKanji"
  | "readingMastery"
  | "readingMastery2"
  | "writingMastery"
  | "newKanji";

/** Per-kind event counts for one day. */
export type DayCounts = Record<ActivityKind, number>;

/** Map of local YYYY-MM-DD → per-kind event counts; days without activity are absent. */
export type ActivityByDay = Record<string, DayCounts>;

export type DateRange = {
  start: string; // inclusive YYYY-MM-DD
  end: string; // inclusive YYYY-MM-DD
};

export type DurationOption =
  | { type: "last365" }
  | { type: "year"; year: number };

/** All zeros; what a day without activity counts as. */
export const EMPTY_DAY_COUNTS: DayCounts = {
  speedKatakana: 0,
  production: 0,
  recognition: 0,
  recognition2: 0,
  fillTheKanji: 0,
  readingMastery: 0,
  readingMastery2: 0,
  writingMastery: 0,
  newKanji: 0,
};

export type ActivityKindFilters = Record<ActivityKind, boolean>;

/** One kind's active days and its count (rounds, batches, sessions, reviews…). */
export type KindStats = { days: number; count: number };

/** Counts over some period: days with any activity, and each kind's own. */
export type ActivityStats = {
  daysActive: number;
  kinds: Record<ActivityKind, KindStats>;
};

export const DEFAULT_KIND_FILTERS: ActivityKindFilters = {
  speedKatakana: true,
  production: true,
  recognition: true,
  recognition2: true,
  fillTheKanji: true,
  readingMastery: true,
  readingMastery2: true,
  writingMastery: true,
  newKanji: true,
};

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  speedKatakana: speedKatakanaPageMeta.shortLabel,
  production: productionPracticePageMeta.shortLabel,
  recognition: recognitionPracticePageMeta.shortLabel,
  recognition2: recognitionPractice2PageMeta.shortLabel,
  fillTheKanji: fillTheKanjiPageMeta.shortLabel,
  readingMastery: READING_MASTERY_LABEL,
  readingMastery2: READING_MASTERY_2_LABEL,
  writingMastery: WRITING_MASTERY_LABEL,
  newKanji: "Items Added",
};

/**
 * The heatmap's checkbox groups, like the practice menu's sections; their
 * order is the order day popovers list the kinds in.
 */
export const ACTIVITY_KIND_GROUPS: {
  heading: string;
  kinds: ActivityKind[];
}[] = [
  {
    heading: "Kanji Mastery ⭐️",
    kinds: ["writingMastery", "readingMastery", "readingMastery2"],
  },
  {
    heading: "Practice Games",
    kinds: [
      "speedKatakana",
      "fillTheKanji",
      "recognition",
      "recognition2",
      "production",
    ],
  },
  { heading: "Review Pile", kinds: ["newKanji"] },
];

/** The order the heatmap's checkboxes and day popovers list them in. */
export const ALL_ACTIVITY_KINDS: ActivityKind[] = ACTIVITY_KIND_GROUPS.flatMap(
  ({ kinds }) => kinds
);
