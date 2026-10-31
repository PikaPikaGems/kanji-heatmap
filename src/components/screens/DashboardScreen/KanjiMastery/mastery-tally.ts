import type {
  CardProgress,
  CardType,
  ReviewPileItemView,
  UTCTimestamp,
} from "engine-contract";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { JLPT_TYPE_ARR, JLPTListItems } from "@/lib/jlpt";
import {
  JOUYOU_GRADE_ARR,
  JouyouGradeListItems,
  toJouyouGrade,
} from "@/lib/jouyou-grade";
import { getBandLabels } from "@/lib/engine/mastery-heatmap-metrics";
import {
  ALL_CARD_TYPES,
  CARD_TYPE_LABELS,
  cardProgress,
} from "@/lib/engine/card-types";
import {
  isCardStarted,
  itemBand,
  type MasteryCardKind,
  type MasteryMetric,
  MASTERY_METRICS,
} from "@/lib/engine/mastery-metrics";

export const MASTERY_CARD_KINDS: readonly MasteryCardKind[] = [
  ...ALL_CARD_TYPES,
  "combined",
];

export const KIND_TITLES: Record<MasteryCardKind, string> = {
  ...CARD_TYPE_LABELS,
  combined: "Combined",
};

type KanjiInfo = ReturnType<GetBasicKanjiInfo>;

export type MasteryGroup = { key: string; label: string; cn: string };

/** What the bars are split by: JLPT levels or Jouyou grades. */
export type MasteryGrouping = {
  groups: readonly MasteryGroup[];
  keyOf: (info: KanjiInfo) => string;
};

export const JLPT_GROUPING: MasteryGrouping = {
  groups: JLPT_TYPE_ARR.map((jlpt) => ({
    key: jlpt,
    label:
      JLPTListItems[jlpt].label !== "Not in JLPT"
        ? JLPTListItems[jlpt].label
        : "~",
    cn: JLPTListItems[jlpt].cn,
  })),
  keyOf: (info) => info?.jlpt ?? "none",
};

export const JOUYOU_GROUPING: MasteryGrouping = {
  groups: JOUYOU_GRADE_ARR.map((grade) => ({
    key: String(grade),
    label:
      JouyouGradeListItems[grade].label !== "Not in Jouyou"
        ? JouyouGradeListItems[grade].label
        : "~",
    cn: JouyouGradeListItems[grade].cn,
  })),
  keyOf: (info) => String(toJouyouGrade(info?.jouyouGrade)),
};

/**
 * Segment counts for one bar, indexed by band: 0 is "Not started", then the
 * metric's bands in order.
 */
export type BandCounts = number[];

export type MasteryTally = {
  /**
   * The 100% each card kind's bars are measured against: kanji with a main
   * anchor word, or for Reading II, kanji with a secondary word.
   */
  totals: Record<MasteryCardKind, number>;
} & Record<MasteryMetric, Record<MasteryCardKind, BandCounts>>;

const emptyBands = (metric: MasteryMetric): BandCounts =>
  new Array<number>(getBandLabels(metric).length + 1).fill(0);

const emptyByKind = (metric: MasteryMetric) => ({
  reading: emptyBands(metric),
  secondaryReading: emptyBands(metric),
  writing: emptyBands(metric),
  combined: emptyBands(metric),
});

const emptyTally = (): MasteryTally => ({
  totals: { reading: 0, secondaryReading: 0, writing: 0, combined: 0 },
  mastery: emptyByKind("mastery"),
  stability: emptyByKind("stability"),
  difficulty: emptyByKind("difficulty"),
});

const countStarted = (
  tally: MasteryTally,
  item: ReviewPileItemView,
  kind: MasteryCardKind,
  now: number
) => {
  for (const metric of MASTERY_METRICS) {
    const band = itemBand(item, kind, metric, now);
    if (band != null) tally[metric][kind][band + 1] += 1;
  }
};

/** Everything not counted into a band is "Not started". */
const fillNotStarted = (tally: MasteryTally) => {
  for (const metric of MASTERY_METRICS) {
    for (const kind of MASTERY_CARD_KINDS) {
      const counts = tally[metric][kind];
      const started = counts.reduce((sum, n) => sum + n, 0);
      counts[0] = Math.max(0, tally.totals[kind] - started);
    }
  }
};

export type MasteryTallies = {
  byGroup: Record<string, MasteryTally>;
  all: MasteryTally;
};

/** Adds one kanji to a tally's totals (Reading II only with a secondary word). */
const addToTotals = (tally: MasteryTally, secondary: boolean) => {
  tally.totals.reading += 1;
  tally.totals.writing += 1;
  tally.totals.combined += 1;
  if (secondary) tally.totals.secondaryReading += 1;
};

/**
 * Buckets every pile card by group, card kind and metric band. `allKanji`
 * is every kanji in the app; only those with an anchor word can be studied,
 * so only they count toward a group's totals (and only those with a
 * secondary word toward Reading II's). `now` (ms) dates the mastery levels.
 */
export const tallyMastery = (
  allKanji: readonly string[],
  pile: readonly ReviewPileItemView[],
  getInfo: GetBasicKanjiInfo,
  hasSecondaryWord: (kanji: string) => boolean,
  grouping: MasteryGrouping,
  now: number
): MasteryTallies => {
  const all = emptyTally();
  const byGroup: Record<string, MasteryTally> = Object.fromEntries(
    grouping.groups.map(({ key }) => [key, emptyTally()])
  );

  for (const kanji of allKanji) {
    const info = getInfo(kanji);
    if (!info?.repWord) continue;
    const secondary = hasSecondaryWord(kanji);
    addToTotals(byGroup[grouping.keyOf(info)], secondary);
    addToTotals(all, secondary);
  }

  for (const item of pile) {
    const info = getInfo(item.kanji);
    const tally = byGroup[grouping.keyOf(info)];
    // A piled kanji whose anchor word (or secondary word) is gone from the
    // data still has progress to show, so it joins the totals rather than
    // overflowing them.
    if (!info?.repWord) {
      addToTotals(tally, item.secondary != null);
      addToTotals(all, item.secondary != null);
    } else if (item.secondary && !hasSecondaryWord(item.kanji)) {
      tally.totals.secondaryReading += 1;
      all.totals.secondaryReading += 1;
    }
    for (const kind of MASTERY_CARD_KINDS) {
      countStarted(tally, item, kind, now);
      countStarted(all, item, kind, now);
    }
  }

  for (const tally of [all, ...Object.values(byGroup)]) fillNotStarted(tally);
  return { byGroup, all };
};

export type TopCard = {
  kanji: string;
  cardType: CardType;
  difficulty: number;
  stability: number;
  lastReviewedAt: UTCTimestamp | undefined;
};

const TOP_COUNT = 10;
const cardsWhere = (
  pile: readonly ReviewPileItemView[],
  keep: (card: CardProgress) => boolean
): TopCard[] =>
  pile.flatMap((item) =>
    ALL_CARD_TYPES.flatMap((cardType) => {
      const card = cardProgress(item, cardType);
      if (!card || !keep(card)) return [];
      return [
        {
          kanji: item.kanji,
          cardType,
          difficulty: card.difficulty,
          stability: card.stability,
          lastReviewedAt: card.lastReviewedAt,
        },
      ];
    })
  );

/** FSRS difficulty (1–10) a card must exceed to count as "most difficult". */
export const MOST_DIFFICULT_ABOVE = 7;

/** Started cards of one type with difficulty above 7, hardest first. */
export const topDifficultCards = (
  pile: readonly ReviewPileItemView[],
  cardType: CardType
): TopCard[] =>
  cardsWhere(pile, isCardStarted)
    .filter(
      (card) =>
        card.cardType === cardType && card.difficulty > MOST_DIFFICULT_ABOVE
    )
    .sort((a, b) => b.difficulty - a.difficulty)
    .slice(0, TOP_COUNT);

/**
 * Cards of one type that fell back to relearning, newest review first. Pile
 * rows keep running totals rather than the last rating, so relearning is what
 * a recent mistake looks like.
 */
export const recentMistakeCards = (
  pile: readonly ReviewPileItemView[],
  cardType: CardType
): TopCard[] =>
  cardsWhere(pile, (card) => card.learningState === "relearning")
    .filter((card) => card.cardType === cardType)
    // UTCTimestamp is fixed-width RFC 3339, so strings sort chronologically.
    .sort((a, b) => {
      const aAt = a.lastReviewedAt ?? "";
      const bAt = b.lastReviewedAt ?? "";
      return aAt < bAt ? 1 : aAt > bAt ? -1 : 0;
    })
    .slice(0, TOP_COUNT);

/**
 * Cards of one type in FSRS review (past learning), lowest stability first.
 * Relearning cards are left out: Recent Mistakes lists those.
 */
export const leastStableCards = (
  pile: readonly ReviewPileItemView[],
  cardType: CardType
): TopCard[] =>
  cardsWhere(pile, (card) => card.learningState === "review")
    .filter((card) => card.cardType === cardType)
    .sort((a, b) => a.stability - b.stability)
    .slice(0, TOP_COUNT);
