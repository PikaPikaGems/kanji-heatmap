import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CircleAlert, CircleHelp, Flame, Turtle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StrokeOrderUnavailableVariant =
  | "question-dashed"
  | "flame-dashed"
  | "alert-dashed"
  | "turtle-dashed";

/**
 * Swap this constant (or pass `variant` to KanjiDMAK) to try alternatives locally.
 * All variants: transparent box + dashed cross axes + centered icon (click = retry).
 * - question-dashed: CircleHelp (?)
 * - flame-dashed: Flame
 * - alert-dashed: CircleAlert
 * - turtle-dashed: Turtle
 */
export const STROKE_ORDER_UNAVAILABLE_VARIANT: StrokeOrderUnavailableVariant =
  "question-dashed";

export function strokeOrderIconSize(boxSize: number): number {
  return Math.round(Math.min(56, Math.max(18, boxSize * 0.18)));
}

/** Same dashed axes used by the stroke-order loading skeleton. */
const DashedCross = ({
  size,
  className,
}: {
  size: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    className={cn("absolute inset-0 text-foreground", className)}
    aria-hidden
  >
    <line
      x1={size / 2}
      y1={0}
      x2={size / 2}
      y2={size}
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray={size < 100 ? "4 4" : "5 5"}
    />
    <line
      x1={0}
      y1={size / 2}
      x2={size}
      y2={size / 2}
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray={size < 100 ? "4 4" : "5 5"}
    />
  </svg>
);

type ShellProps = {
  size: number;
  onRetry: () => void;
  className?: string;
  children: ReactNode;
};

/** Sized clickable box — preserves layout; click retries the SVG fetch. */
export const StrokeOrderUnavailableShell = ({
  size,
  onRetry,
  className,
  children,
}: ShellProps) => (
  <button
    type="button"
    onClick={(e) => {
      // StrokeOrderReplay wraps the drawing in its own click-to-replay control.
      e.stopPropagation();
      onRetry();
    }}
    title="Retry loading stroke order"
    aria-label="Stroke order unavailable. Click to retry."
    className={cn(
      "relative flex items-center justify-center overflow-hidden bg-transparent",
      "text-muted-foreground transition-colors",
      "hover:text-foreground/70 focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "rounded-3xl",
      className
    )}
    style={{ width: size, height: size }}
  >
    {children}
  </button>
);

const DashedIconFallback = ({
  size,
  onRetry,
  Icon,
  crossClassName = "opacity-20",
  iconClassName,
}: {
  size: number;
  onRetry: () => void;
  Icon: LucideIcon;
  crossClassName?: string;
  iconClassName?: string;
}) => {
  const icon = strokeOrderIconSize(size);
  return (
    <StrokeOrderUnavailableShell size={size} onRetry={onRetry}>
      <DashedCross size={size} className={crossClassName} />
      <Icon
        className={cn("relative z-[1]", iconClassName)}
        style={{ width: icon, height: icon }}
        strokeWidth={1.75}
        aria-hidden
      />
    </StrokeOrderUnavailableShell>
  );
};

export const StrokeOrderUnavailableQuestionDashed = ({
  size,
  onRetry,
}: {
  size: number;
  onRetry: () => void;
}) => <DashedIconFallback size={size} onRetry={onRetry} Icon={CircleHelp} />;

export const StrokeOrderUnavailableFlameDashed = ({
  size,
  onRetry,
}: {
  size: number;
  onRetry: () => void;
}) => <DashedIconFallback size={size} onRetry={onRetry} Icon={Flame} />;

export const StrokeOrderUnavailableAlertDashed = ({
  size,
  onRetry,
}: {
  size: number;
  onRetry: () => void;
}) => <DashedIconFallback size={size} onRetry={onRetry} Icon={CircleAlert} />;

export const StrokeOrderUnavailableTurtleDashed = ({
  size,
  onRetry,
}: {
  size: number;
  onRetry: () => void;
}) => <DashedIconFallback size={size} onRetry={onRetry} Icon={Turtle} />;
