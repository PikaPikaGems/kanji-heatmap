import { Eye, PenLine, type LucideIcon } from "lucide-react";
import type { CardProgress, ReviewPileItemView } from "engine-contract";
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
import { NOT_STARTED_LABEL } from "@/lib/engine/mastery-heatmap-metrics";
import {
  isCardStarted,
  MASTERY_LEVEL_LABELS,
  masteryLevel,
} from "@/lib/engine/mastery-metrics";
import { relativeTime } from "@/lib/engine/relative-time";

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
};

type Field = {
  label: string;
  /** Short plain-English meaning, shown in the label's info popover. */
  definition: string;
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

/** Like `valueField`, for values a card only has once it has been graded. */
const studiedField = (
  label: string,
  definition: string,
  value: (card: CardProgress, now: number) => string
): Field => ({
  label,
  definition,
  cell: (card, now) => {
    if (card == null) return { text: NOT_APPLICABLE };
    return { text: isCardStarted(card) ? value(card, now) : NONE };
  },
});

const masteryCell = (card: CardProgress | null, now: number): Cell => {
  const level = card && isCardStarted(card) ? masteryLevel(card, now) : null;
  return {
    text: level == null ? NOT_STARTED_LABEL : MASTERY_LEVEL_LABELS[level],
    swatchCn: getBandFillCn("mastery", level),
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
    definition: `How well it has stuck over time: ${[
      NOT_STARTED_LABEL,
      ...MASTERY_LEVEL_LABELS,
    ].join(
      ", "
    )}. It moves up as you keep remembering it across longer gaps, and drops back when you forget it.`,
    cell: masteryCell,
  },
  studiedField(
    "Stability",
    "About how long the memory lasts before you're likely to start forgetting it. It grows each time you remember.",
    (card) => formatDaysHuman(card.stability)
  ),
  studiedField(
    "Difficulty",
    "How hard it is for you, from 1 (easy) to 10 (hard). Forgetting raises it; easy answers lower it.",
    (card) => `${card.difficulty.toFixed(1)} / 10`
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
        <p>{definition}</p>
      </div>
    }
  />
);

const COLUMNS: {
  title: string;
  Icon: LucideIcon;
  kind: "writing" | "reading";
}[] = [
  { title: "Reading", Icon: Eye, kind: "reading" },
  { title: "Writing", Icon: PenLine, kind: "writing" },
];

/**
 * A kanji's reading and writing progress side by side, one field per row.
 * `item` is null when there is nothing to show yet (logged out, or not in
 * the review pile), which fills every cell with its default.
 */
export const ProgressTable = ({
  item,
}: {
  item: ReviewPileItemView | null;
}) => {
  const now = Date.now();

  return (
    <div className="overflow-hidden border rounded-xl border-foreground/10 bg-muted/10">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="border-foreground/10 bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[36%] h-auto px-2 py-2 text-[10px] font-bold tracking-wider uppercase sm:w-48 sm:px-3">
              Field
            </TableHead>
            {COLUMNS.map(({ title, Icon }) => (
              <TableHead
                key={title}
                className="h-auto px-2 py-2 text-[10px] font-bold tracking-wider uppercase text-foreground sm:px-3"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {title}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {FIELDS.map(({ label, definition, cell }) => (
            <TableRow
              key={label}
              className="border-dotted border-foreground/15 hover:bg-transparent"
            >
              <TableCell className="px-2 py-1.5 text-left sm:px-3">
                <FieldLabel label={label} definition={definition} />
              </TableCell>
              {COLUMNS.map(({ kind }) => {
                const { text, swatchCn } = cell(item?.[kind] ?? null, now);
                return (
                  <TableCell
                    key={kind}
                    className="px-2 py-1.5 text-[13px] font-bold text-left break-words tabular-nums sm:px-3 sm:text-sm"
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
