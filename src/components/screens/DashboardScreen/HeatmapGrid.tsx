import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

type ToggleDetail = (anchor: HTMLElement, detail: ReactNode) => void;

const HeatmapPopoverContext = createContext<ToggleDetail | null>(null);

type PopoverState = { anchor: HTMLElement; detail: ReactNode; open: boolean };

/**
 * One detail popover shared by every HeatmapCell inside it. A Radix Popover
 * per cell made opening the Fill in the Kanji heatmap (~1,900 cells) take about
 * a second; cells are now plain buttons that point this popover at themselves.
 */
export const HeatmapPopoverProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, setState] = useState<PopoverState | null>(null);
  // Set when the popover closes from a click elsewhere, so focus isn't pulled
  // back to the old cell (what Radix does for a regular PopoverTrigger).
  const closedByOutsideRef = useRef(false);

  // Stable so the provider's state changes don't re-render every cell.
  const toggle = useCallback<ToggleDetail>((anchor, detail) => {
    setState((cur) =>
      cur?.open && cur.anchor === anchor
        ? { ...cur, open: false }
        : { anchor, detail, open: true }
    );
  }, []);

  const anchor = state?.anchor;

  return (
    <HeatmapPopoverContext.Provider value={toggle}>
      {children}
      <Popover
        open={state?.open ?? false}
        onOpenChange={(open) => {
          if (!open) setState((cur) => cur && { ...cur, open: false });
        }}
      >
        {anchor && <PopoverAnchor virtualRef={{ current: anchor }} />}
        <PopoverContent
          className="w-56 p-3"
          side="top"
          onOpenAutoFocus={() => {
            closedByOutsideRef.current = false;
          }}
          onInteractOutside={(e) => {
            // A click on the open cell itself is handled by its toggle.
            if (anchor?.contains(e.target as Node)) {
              e.preventDefault();
              return;
            }
            closedByOutsideRef.current = true;
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (!closedByOutsideRef.current) anchor?.focus();
          }}
        >
          {/* Kept after closing so the fade-out still shows the content. */}
          {state?.detail}
        </PopoverContent>
      </Popover>
    </HeatmapPopoverContext.Provider>
  );
};

/** One heatmap square: colored button that opens the shared detail popover. */
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
}) => {
  const toggleDetail = useContext(HeatmapPopoverContext);
  if (!toggleDetail) {
    throw new Error("HeatmapCell must be inside a HeatmapPopoverProvider");
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      title={label}
      onClick={(e) => toggleDetail(e.currentTarget, detail)}
      style={{ width: cellPx, height: cellPx }}
      className={cn(
        "cursor-pointer rounded-[2px] outline-none transition-colors",
        "hover:bg-cyan-400 hover:border-foreground",
        "hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1 hover:ring-offset-background",
        "focus-visible:ring-2 focus-visible:ring-ring",
        fillCn
      )}
    />
  );
};

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
  /** One label per row, shared by every column (weekday-style). Omit when
   * rows are not the same meaning across columns. */
  leftLabels?: ReactNode[];
  children: ReactNode;
}) => {
  const showLeft = leftLabels != null && leftLabels.length > 0;

  return (
    <div className="overflow-x-auto pb-2 mb-4 px-1 [-webkit-mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)] [mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)] sm:[-webkit-mask-image:none] sm:[mask-image:none]">
      <div
        className="inline-grid"
        style={{
          gridTemplateAreas: showLeft
            ? `"empty top" "left squares"`
            : `"top" "squares"`,
          gridTemplateColumns: showLeft ? "auto 1fr" : "1fr",
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

        {showLeft ? (
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
        ) : null}

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
};
