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
  isCardStarted,
  itemBand,
  type MasteryCardKind,
  type MasteryMetric,
  MASTERY_METRICS,
} from "@/lib/engine/mastery-metrics";

export const MASTERY_CARD_KINDS: readonly MasteryCardKind[] = [
  "reading",
  "writing",
  "combined",
];

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
  /** Kanji that have an anchor word: the 100% every bar is measured against. */
  total: number;
} & Record<MasteryMetric, Record<MasteryCardKind, BandCounts>>;

const emptyBands = (metric: MasteryMetric): BandCounts =>
  new Array<number>(getBandLabels(metric).length + 1).fill(0);

const emptyByKind = (metric: MasteryMetric) => ({
  reading: emptyBands(metric),
  writing: emptyBands(metric),
  combined: emptyBands(metric),
});

const emptyTally = (): MasteryTally => ({
  total: 0,
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
      counts[0] = Math.max(0, tally.total - started);
    }
  }
};

export type MasteryTallies = {
  byGroup: Record<string, MasteryTally>;
  all: MasteryTally;
};

/**
 * Buckets every pile card by group, card kind and metric band. `allKanji`
 * is every kanji in the app; only those with an anchor word can be studied,
 * so only they count toward a group's total. `now` (ms) dates the mastery
 * levels.
 */
export const tallyMastery = (
  allKanji: readonly string[],
  pile: readonly ReviewPileItemView[],
  getInfo: GetBasicKanjiInfo,
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
    byGroup[grouping.keyOf(info)].total += 1;
    all.total += 1;
  }

  for (const item of pile) {
    const info = getInfo(item.kanji);
    const tally = byGroup[grouping.keyOf(info)];
    // A piled kanji whose anchor word is gone from the data still has
    // progress to show, so it joins the total rather than overflowing it.
    if (!info?.repWord) {
      tally.total += 1;
      all.total += 1;
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
  lastReviewedAt: UTCTimestamp | undefined;
};

const TOP_COUNT = 10;
const CARD_TYPES: readonly CardType[] = ["reading", "writing"];

const cardsWhere = (
  pile: readonly ReviewPileItemView[],
  keep: (card: CardProgress) => boolean
): TopCard[] =>
  pile.flatMap((item) =>
    CARD_TYPES.filter((cardType) => keep(item[cardType])).map((cardType) => ({
      kanji: item.kanji,
      cardType,
      difficulty: item[cardType].difficulty,
      lastReviewedAt: item[cardType].lastReviewedAt,
    }))
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
