import { SnailIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function iconSize(boxSize: number): number {
  return Math.round(Math.min(72, Math.max(24, boxSize * 0.28)));
}

const DashedCross = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    className="absolute inset-0 text-foreground opacity-20"
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

/** Sized empty state when the kanji stroke SVG cannot be fetched. Click retries. */
export const StrokeOrderUnavailable = ({
  size,
  onRetry,
}: {
  size: number;
  onRetry: () => void;
}) => {
  const icon = iconSize(size);
  return (
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
        "relative flex items-center justify-center overflow-hidden",
        "rounded-3xl bg-transparent",
        "text-foreground transition-colors",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted-foreground/5"
      )}
      style={{ width: size, height: size }}
    >
      <DashedCross size={size} />
      <SnailIcon
        className="relative z-[1] animate-pulse "
        style={{ width: icon, height: icon }}
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  );
};
