import type { ReactNode } from "react";
import { Eye, PenLine, type LucideIcon } from "lucide-react";
import type {
  CardProgress,
  CardType,
  ReviewPileItemView,
} from "engine-contract";
import { InfoIcon } from "@/components/icons";
import { GenericPopover } from "@/components/common/GenericPopover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDaysHuman, formatInterval } from "@/lib/engine/format-interval";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import { BandRows } from "@/components/screens/MasteryScreen/MeasureIntro";
import {
  MEASURE_INTROS,
  NEW_LABEL,
} from "@/lib/engine/mastery-heatmap-metrics";
import {
  bandEmoji,
  difficultyBand,
  isCardStarted,
  MASTERY_LEVEL_LABELS,
  masteryLevel,
  type MasteryMetric,
  stabilityBand,
} from "@/lib/engine/mastery-metrics";
import { relativeTime } from "@/lib/engine/relative-time";
import {
  ALL_CARD_TYPES,
  CARD_TYPE_LABELS,
  cardProgress,
} from "@/lib/engine/card-types";
import { cnHatched } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

const NONE = "—";
const NOT_APPLICABLE = "N/A";

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const formatDate = (timestamp: string) =>
  new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const correctCount = (card: CardProgress) => {
  const ratings = card.ratingsSummary ?? {};
  return (ratings.hard ?? 0) + (ratings.good ?? 0) + (ratings.easy ?? 0);
};

type Cell = {
  text: string;
  /** Fill of a small swatch before the text, as on the /mastery heatmap. */
  swatchCn?: string;
  /** The band's emoji before the swatch (see `bandEmoji`). */
  emoji?: string;
};

type Field = {
  label: string;
  /** Short plain-English meaning, shown in the label's info popover. */
  definition: ReactNode;
  /**
   * The cell for one card. `card` is null when there is no card yet (logged
   * out, or the kanji is not in the review pile).
   */
  cell: (card: CardProgress | null, now: number) => Cell;
};

/** A field that is a plain value of a card (`fallback` with no card). */
const valueField = (
  label: string,
  definition: string,
  fallback: string,
  value: (card: CardProgress, now: number) => string
): Field => ({
  label,
  definition,
  cell: (card, now) => ({ text: card ? value(card, now) : fallback }),
});

/**
 * Like `valueField`, for values a card only has once it has been graded.
 * With `band`, a swatch in the card's /mastery heatmap color for that
 * measure goes before the value.
 */
const studiedField = (
  label: string,
  definition: string,
  value: (card: CardProgress, now: number) => string,
  band?: { measure: MasteryMetric; of: (card: CardProgress) => number }
): Field => ({
  label,
  definition,
  cell: (card, now) => {
    if (card == null) return { text: NOT_APPLICABLE };
    if (!isCardStarted(card)) return { text: NONE };
    if (!band) return { text: value(card, now) };
    const of = band.of(card);
    return {
      text: value(card, now),
      swatchCn: getBandFillCn(band.measure, of),
      emoji: bandEmoji(of),
    };
  },
});

const masteryCell = (card: CardProgress | null, now: number): Cell => {
  const level = card && isCardStarted(card) ? masteryLevel(card, now) : null;
  return {
    text: level == null ? NEW_LABEL : MASTERY_LEVEL_LABELS[level],
    swatchCn: getBandFillCn("mastery", level),
    emoji: bandEmoji(level),
  };
};

/** The rows of the table, top to bottom (design doc 5.4). */
const FIELDS: Field[] = [
  valueField(
    "Next review",
    "When it comes up for review again. Due now means it's ready to review.",
    NOT_APPLICABLE,
    (card, now) => {
      const dueMs = Date.parse(card.dueAt);
      return dueMs <= now ? "Due now" : formatInterval(dueMs - now);
    }
  ),
  {
    label: "Mastery",
    // The same bands as the /mastery legend's popover.
    definition: (
      <>
        <p className="mb-2">{MEASURE_INTROS.mastery}</p>
        <BandRows measure="mastery" />
      </>
    ),
    cell: masteryCell,
  },
  studiedField(
    "Stability",
    "About how long the memory lasts before you're likely to start forgetting it. It grows each time you remember.",
    (card) => formatDaysHuman(card.stability),
    { measure: "stability", of: (card) => stabilityBand(card.stability) }
  ),
  studiedField(
    "Difficulty",
    "How hard it is for you, from 1 (easy) to 10 (hard). Forgetting raises it; easy answers lower it. A brighter square means easier.",
    (card) => `${card.difficulty.toFixed(1)} / 10`,
    { measure: "difficulty", of: (card) => difficultyBand(card.difficulty) }
  ),
  valueField(
    "State",
    "Where it is in its schedule: New (not reviewed yet), Learning (first short steps), Review (spaced-out reviews) or Relearning (short steps again after you forgot it).",
    NOT_APPLICABLE,
    (card) => capitalize(card.learningState)
  ),
  valueField("Reviews", "How many times you've reviewed it.", "0", (card) =>
    String(card.repetitions)
  ),
  valueField(
    "Correct",
    "Reviews you answered Hard, Good or Easy (anything but Again).",
    "0",
    (card) => String(correctCount(card))
  ),
  valueField(
    "Accuracy",
    "How many of your reviews were correct, as a percentage.",
    NOT_APPLICABLE,
    (card) =>
      card.repetitions > 0
        ? `${Math.min(100, Math.round((correctCount(card) / card.repetitions) * 100))}%`
        : NONE
  ),
  valueField(
    "Lapses",
    "How many times you forgot it (answered Again) after you had learned it.",
    "0",
    (card) => String(card.lapses)
  ),
  valueField(
    "First studied",
    "The day of your first review.",
    NOT_APPLICABLE,
    (card) => (card.firstReviewedAt ? formatDate(card.firstReviewedAt) : NONE)
  ),
  valueField(
    "Last reviewed",
    "How long ago your last review was.",
    NOT_APPLICABLE,
    (card) =>
      card.lastReviewedAt ? relativeTime(Date.parse(card.lastReviewedAt)) : NONE
  ),
  studiedField(
    "Recall now",
    "The chance you'd remember it if you were asked right now. It drops as time passes since your last review.",
    (card) => `${Math.round(card.retrievability * 100)}%`
  ),
];

/** A field name; tapping it opens the field's definition. */
const FieldLabel = ({ label, definition }: Omit<Field, "cell">) => (
  <GenericPopover
    trigger={
      <button
        type="button"
        className="text-xs text-left rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        {/* No-break space: the icon never wraps onto a line of its own. */}
        {" "}
        <InfoIcon className="inline-block -translate-y-px" size={12} />
      </button>
    }
    content={
      <div className="px-4 py-3 text-xs text-left w-60">
        <p className="mb-1 font-bold">{label}</p>
        {typeof definition === "string" ? <p>{definition}</p> : definition}
      </div>
    }
  />
);

const COLUMN_ICONS: Record<CardType, LucideIcon> = {
  writing: PenLine,
  reading: Eye,
  secondaryReading: Eye,
};

/** The word each card asks about; `secondaryReading` is absent without a secondary word. */
export type ProgressTableWords = Partial<Record<CardType, string>>;

/** "No 2nd word": one hatched cell down the whole Reading II column. */
const NO_SECONDARY_WORD = "No 2nd word";

const ColumnHeader = ({ cardType }: { cardType: CardType }) => {
  const Icon = COLUMN_ICONS[cardType];
  return (
    <TableHead className="h-auto px-1.5 py-2 align-middle sm:px-3">
      <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap text-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {CARD_TYPE_LABELS[cardType]}
      </span>
    </TableHead>
  );
};

/** The first row: what each card tests, above "Next review". */
const TARGET_FIELD = {
  label: "Target",
  definition:
    "What the card tests: the kanji you write (Writing), the main anchor word you read (Reading I) or the secondary one (Reading II).",
};

/**
 * A kanji's cards side by side (Writing, Reading I, Reading II), one field
 * per row, the first row being what each card tests. `item` is null when
 * there is nothing to show yet (logged out, or not in the review pile), which
 * fills every cell with its default. Without a secondary word the Reading II
 * column is one hatched "No 2nd word" cell. On phones the table scrolls
 * sideways instead of squeezing its columns.
 */
export const ProgressTable = ({
  item,
  words,
}: {
  item: ReviewPileItemView | null;
  words: ProgressTableWords;
}) => {
  const now = Date.now();
  const hasSecondary = words.secondaryReading != null;

  return (
    <div className="mt-4 overflow-hidden border rounded-xl border-foreground/10 bg-muted/10">
      <Table className="table-fixed min-w-[26rem]">
        <TableHeader>
          <TableRow className="border-foreground/10 bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[28%] h-auto px-2 py-2 text-[10px] font-bold tracking-wider uppercase align-middle sm:w-40 sm:px-3">
              Field
            </TableHead>
            {ALL_CARD_TYPES.map((cardType) => (
              <ColumnHeader key={cardType} cardType={cardType} />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="border-dotted border-foreground/15 hover:bg-transparent">
            <TableCell className="px-2 py-1.5 text-left sm:px-3">
              <FieldLabel {...TARGET_FIELD} />
            </TableCell>
            {ALL_CARD_TYPES.map((cardType) => {
              if (cardType === "secondaryReading" && !hasSecondary) {
                return (
                  <TableCell
                    key={cardType}
                    rowSpan={FIELDS.length + 1}
                    className={cn(
                      cnHatched,
                      "px-1.5 text-xs font-bold text-center align-middle text-muted-foreground sm:px-3"
                    )}
                  >
                    {NO_SECONDARY_WORD}
                  </TableCell>
                );
              }
              return (
                <TableCell
                  key={cardType}
                  className="px-1.5 py-1.5 text-lg text-left truncate kanji-font sm:px-3"
                >
                  {words[cardType] ?? NONE}
                </TableCell>
              );
            })}
          </TableRow>
          {FIELDS.map(({ label, definition, cell }) => (
            <TableRow
              key={label}
              className="border-dotted border-foreground/15 hover:bg-transparent"
            >
              <TableCell className="px-2 py-1.5 text-left sm:px-3">
                <FieldLabel label={label} definition={definition} />
              </TableCell>
              {ALL_CARD_TYPES.map((cardType) => {
                if (cardType === "secondaryReading" && !hasSecondary) {
                  return null;
                }
                const card = item ? cardProgress(item, cardType) : null;
                const { text, swatchCn } = cell(card, now);
                return (
                  <TableCell
                    key={cardType}
                    className="px-1.5 py-1.5 text-xs font-bold text-left tabular-nums sm:px-3 sm:text-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      {swatchCn ? (
                        <span
                          className={`inline-block size-3 shrink-0 rounded-sm border border-black/20 dark:border-white/25 ${swatchCn}`}
                          aria-hidden
                        />
                      ) : null}
                      {text}
                    </span>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
