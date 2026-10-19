import { useState } from "react";
import { FreqSquare } from "@/components/common/freq/FreqSquare";
import { GenericPopover } from "@/components/common/GenericPopover";
import { InfoIcon } from "@/components/icons";
import { TableCell, TableRow } from "@/components/ui/table";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import {
  getBandLabels,
  NOT_STARTED_LABEL,
} from "@/lib/engine/mastery-heatmap-metrics";
import type { MasteryMetric } from "@/lib/engine/mastery-metrics";
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
  title,
  counts,
  total,
  measure,
}: {
  title: string;
  counts: BandCounts;
  total: number;
  measure: MasteryMetric;
}) => {
  const { labels } = segmentsOf(measure);
  return (
    <div className="px-4 py-3 text-left w-64">
      <p className="mb-2 text-xs font-bold">{title}</p>
      <ul className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-2 gap-y-1 text-[11px]">
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
    </div>
  );
};

/**
 * One level's bar (or "All"): its label with an ⓘ, the segmented bar and
 * "started / total". Tapping the bar or the label opens its breakdown in a
 * popover pointing at the bar.
 */
export const MasteryBarRow = ({
  label,
  title,
  dotCn,
  counts,
  total,
  measure,
}: {
  label: string;
  /** The breakdown popover's heading, e.g. "N5 · Reading Mastery". */
  title: string;
  /** Level color dot; none for the "All" row. */
  dotCn?: string;
  counts: BandCounts;
  total: number;
  measure: MasteryMetric;
}) => {
  const [open, setOpen] = useState(false);
  const { labels, fills } = segmentsOf(measure);
  const started = total - counts[0];

  return (
    <TableRow className="p-0 my-1 text-left">
      <TableCell className="p-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center py-1 pl-2 text-xs rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className={`inline-block w-3 h-3 rounded-full shrink-0 ${dotCn ?? ""}`}
          />
          <span className="ml-2 mr-1 font-extrabold whitespace-nowrap">
            {label}
          </span>
          <InfoIcon
            aria-hidden
            size={11}
            className="mr-2 shrink-0 text-muted-foreground"
          />
        </button>
      </TableCell>
      <TableCell className="w-full px-0 py-0">
        <GenericPopover
          open={open}
          onOpenChange={setOpen}
          focusOnOpen={false}
          trigger={
            <button
              type="button"
              aria-label={`${title}: breakdown`}
              className="block w-full py-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <SegmentedBandBar
                counts={counts}
                totalUnits={total}
                bandCn={fills}
                bandLabels={labels}
              />
            </button>
          }
          content={
            <BandBreakdown
              title={title}
              counts={counts}
              total={total}
              measure={measure}
            />
          }
        />
      </TableCell>
      <TableCell className="p-0 text-[10px] tabular-nums">
        <span className="inline-block min-w-16 text-end">
          {started} / {total}
        </span>
      </TableCell>
    </TableRow>
  );
};
