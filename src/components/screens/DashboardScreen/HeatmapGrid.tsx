import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FreqCategory, freqCategoryCn } from "@/lib/freq/freq-category";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMPHASIS_BORDER =
  "border border-solid border-foreground dark:border-foreground";

/**
 * Fill classes for a heatmap square: muted for level 0, frequency-category
 * color otherwise. `emphasizeBorder` marks a special cell (e.g. today).
 */
export const heatmapFillCn = (level: FreqCategory, emphasizeBorder = false) =>
  level === 0
    ? cn(
        "bg-muted/50 dark:bg-muted/30",
        emphasizeBorder ? EMPHASIS_BORDER : "border border-border dark:border-border"
      )
    : cn(
        freqCategoryCn[level],
        emphasizeBorder
          ? EMPHASIS_BORDER
          : "border border-black/10 dark:border-white/10"
      );

/** One heatmap square: colored button that opens a detail popover. */
export const HeatmapCell = ({
  cellPx,
  fillCn,
  label,
  detail,
}: {
  cellPx: number;
  fillCn: string;
  label: string;
  detail: ReactNode;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label={label}
        title={label}
        style={{ width: cellPx, height: cellPx }}
        className={cn(
          "cursor-pointer rounded-[2px] outline-none transition-colors",
          "hover:bg-cyan-400 hover:border-foreground",
          "hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1 hover:ring-offset-background",
          "focus-visible:ring-2 focus-visible:ring-ring",
          fillCn
        )}
      />
    </PopoverTrigger>
    <PopoverContent className="p-3 w-52" side="top">
      {detail}
    </PopoverContent>
  </Popover>
);

/**
 * Fixed-size contribution grid (GitHub/Cursor-style): top labels (one per
 * column), left labels (one per row), and column-flow squares. Cells never
 * shrink; narrow viewports get a masked overflow-x scroll.
 */
export const HeatmapGrid = ({
  cellPx,
  gapPx = 3,
  rowCount,
  topLabels,
  topLabelCn = "h-3",
  leftLabels,
  children,
}: {
  cellPx: number;
  gapPx?: number;
  rowCount: number;
  topLabels: ReactNode[];
  topLabelCn?: string;
  leftLabels: ReactNode[];
  children: ReactNode;
}) => (
  <div className="overflow-x-auto pb-2 mb-4 px-1 [-webkit-mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)] [mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)] sm:[-webkit-mask-image:none] sm:[mask-image:none]">
    <div
      className="inline-grid"
      style={{
        gridTemplateAreas: `"empty top" "left squares"`,
        gridTemplateColumns: "auto 1fr",
        columnGap: 6,
        rowGap: gapPx,
      }}
    >
      {/* Top labels — one column per grid column, same width as cells */}
      <div
        className="text-[10px] leading-none text-muted-foreground"
        style={{
          gridArea: "top",
          display: "grid",
          gridTemplateColumns: `repeat(${topLabels.length}, ${cellPx}px)`,
          columnGap: gapPx,
        }}
      >
        {topLabels.map((label, i) => (
          <div key={i} className={topLabelCn}>
            {label}
          </div>
        ))}
      </div>

      {/* Left labels — same row height as cells so they align */}
      <div
        className="text-[10px] leading-none text-muted-foreground"
        style={{
          gridArea: "left",
          display: "grid",
          gridTemplateRows: `repeat(${rowCount}, ${cellPx}px)`,
          rowGap: gapPx,
        }}
      >
        {leftLabels.map((label, i) => (
          <div key={i} className="flex items-center justify-end pr-0.5">
            {label}
          </div>
        ))}
      </div>

      {/* Squares — column flow: down each column, then the next */}
      <div
        style={{
          gridArea: "squares",
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: cellPx,
          gridTemplateRows: `repeat(${rowCount}, ${cellPx}px)`,
          gap: gapPx,
        }}
      >
        {children}
      </div>
    </div>
  </div>
);
