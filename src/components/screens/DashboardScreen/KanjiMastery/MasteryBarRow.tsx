import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FreqSquare } from "@/components/common/freq/FreqSquare";
import { TableCell, TableRow } from "@/components/ui/table";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import {
  getBandLabels,
  NOT_STARTED_LABEL,
} from "@/lib/engine/mastery-heatmap-metrics";
import type { MasteryMetric } from "@/lib/engine/mastery-metrics";
import { cn } from "@/lib/utils";
import { SegmentedBandBar } from "../SegmentedBandBar";
import type { BandCounts } from "./mastery-tally";

/** Labels and fills per segment; index 0 is "Not started" (the empty track). */
const segmentsOf = (measure: MasteryMetric) => {
  const labels = getBandLabels(measure);
  return {
    labels: [NOT_STARTED_LABEL, ...labels],
    fills: ["", ...labels.map((_, band) => getBandFillCn(measure, band))],
  };
};

const percent = (count: number, total: number) => {
  if (total === 0) return "0%";
  const value = (count / total) * 100;
  return `${value < 10 && value > 0 ? value.toFixed(1) : Math.round(value)}%`;
};

/** Every segment of a bar as a square, its name, its count and its share. */
const BandBreakdown = ({
  counts,
  total,
  measure,
}: {
  counts: BandCounts;
  total: number;
  measure: MasteryMetric;
}) => {
  const { labels } = segmentsOf(measure);
  return (
    <ul className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-2 gap-y-1 px-3 py-2 mx-1 mb-2 text-[11px] border border-dotted rounded-lg animate-fade-in-fast">
      {counts.map((count, segment) => (
        <li key={labels[segment]} className="contents">
          <span aria-hidden className="inline-flex">
            <FreqSquare
              srOnly=""
              cn={getBandFillCn(measure, segment === 0 ? null : segment - 1)}
            />
          </span>
          <span className="font-semibold">{labels[segment]}</span>
          <span className="text-right tabular-nums">{count}</span>
          <span className="text-right tabular-nums text-muted-foreground min-w-10">
            {percent(count, total)}
          </span>
        </li>
      ))}
    </ul>
  );
};

/**
 * One bar in a table row (a level, or a card type's total): its label, the
 * segmented bar and "started / total". Tapping the row opens its breakdown
 * under it.
 */
export const MasteryBarRow = ({
  label,
  dotCn,
  counts,
  total,
  measure,
  thick = false,
}: {
  label: string;
  /** Level color dot; none for card-type totals. */
  dotCn?: string;
  counts: BandCounts;
  total: number;
  measure: MasteryMetric;
  /** The totals use a thicker bar than the level rows. */
  thick?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const { labels, fills } = segmentsOf(measure);
  const started = total - counts[0];

  return (
    <>
      <TableRow
        className="p-0 my-1 text-left cursor-pointer"
        onClick={() => setOpen((was) => !was)}
      >
        <TableCell className="p-0">
          <button
            type="button"
            aria-expanded={open}
            className="flex items-center py-1 pl-2 text-xs rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {dotCn && (
              <span
                className={`inline-block w-3 h-3 rounded-full shrink-0 ${dotCn}`}
              />
            )}
            <span
              className={cn(
                "font-extrabold whitespace-nowrap",
                dotCn ? "mx-2" : "mr-2"
              )}
            >
              {label}
            </span>
            <ChevronDown
              aria-hidden
              className={cn(
                "size-3 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
        </TableCell>
        <TableCell className="w-full px-0 py-2">
          <SegmentedBandBar
            counts={counts}
            totalUnits={total}
            bandCn={fills}
            bandLabels={labels}
            className={thick ? "h-2" : undefined}
          />
        </TableCell>
        <TableCell className="p-0 text-[10px] tabular-nums">
          <span className="inline-block min-w-16 text-end">
            {started} / {total}
          </span>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={3} className="p-0">
            <BandBreakdown counts={counts} total={total} measure={measure} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
