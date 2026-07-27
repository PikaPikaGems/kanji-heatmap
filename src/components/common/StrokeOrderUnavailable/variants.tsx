import type { ReactNode } from "react";
import { CloudOff, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type StrokeOrderUnavailableVariant =
  | "wifi-dashed"
  | "wifi-muted"
  | "wifi-bare"
  | "cloud-dashed"
  | "wifi-circle";

/**
 * Swap this constant (or pass `variant` to KanjiDMAK) to try alternatives locally.
 * - wifi-dashed: muted square + dashed cross + WifiOff (matches loading skeleton)
 * - wifi-muted: muted square + WifiOff, no cross
 * - wifi-bare: icon only in the sized box (no fill)
 * - cloud-dashed: muted square + dashed cross + CloudOff
 * - wifi-circle: muted square + soft circle behind WifiOff (clearer click target)
 */
export const STROKE_ORDER_UNAVAILABLE_VARIANT: StrokeOrderUnavailableVariant =
  "wifi-dashed";

export function strokeOrderIconSize(boxSize: number): number {
  return Math.round(Math.min(56, Math.max(18, boxSize * 0.18)));
}

const DashedCross = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    className="absolute inset-0 text-foreground opacity-10"
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
      "relative flex items-center justify-center overflow-hidden",
      "text-muted-foreground transition-colors",
      "hover:text-foreground/70 focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    style={{ width: size, height: size }}
  >
    {children}
  </button>
);

export const StrokeOrderUnavailableWifiDashed = ({
  size,
  onRetry,
}: {
  size: number;
  onRetry: () => void;
}) => {
  const icon = strokeOrderIconSize(size);
  return (
    <StrokeOrderUnavailableShell
      size={size}
      onRetry={onRetry}
      className={cn(
        "bg-muted hover:bg-muted/80",
        size < 100 ? "rounded-2xl" : "rounded-3xl"
      )}
    >
      <DashedCross size={size} />
      <WifiOff
        className="relative z-[1]"
        style={{ width: icon, height: icon }}
        strokeWidth={1.75}
        aria-hidden
      />
    </StrokeOrderUnavailableShell>
  );
};

export const StrokeOrderUnavailableWifiMuted = ({
  size,
  onRetry,
}: {
  size: number;
  onRetry: () => void;
}) => {
  const icon = strokeOrderIconSize(size);
  return (
    <StrokeOrderUnavailableShell
      size={size}
      onRetry={onRetry}
      className={cn(
        "bg-muted hover:bg-muted/80",
        size < 100 ? "rounded-2xl" : "rounded-3xl"
      )}
    >
      <WifiOff
        style={{ width: icon, height: icon }}
        strokeWidth={1.75}
        aria-hidden
      />
    </StrokeOrderUnavailableShell>
  );
};

export const StrokeOrderUnavailableWifiBare = ({
  size,
  onRetry,
}: {
  size: number;
  onRetry: () => void;
}) => {
  const icon = strokeOrderIconSize(size);
  return (
    <StrokeOrderUnavailableShell
      size={size}
      onRetry={onRetry}
      className="bg-transparent hover:bg-muted/40 rounded-3xl"
    >
      <WifiOff
        style={{ width: icon, height: icon }}
        strokeWidth={1.75}
        aria-hidden
      />
    </StrokeOrderUnavailableShell>
  );
};

export const StrokeOrderUnavailableCloudDashed = ({
  size,
  onRetry,
}: {
  size: number;
  onRetry: () => void;
}) => {
  const icon = strokeOrderIconSize(size);
  return (
    <StrokeOrderUnavailableShell
      size={size}
      onRetry={onRetry}
      className={cn(
        "bg-muted hover:bg-muted/80",
        size < 100 ? "rounded-2xl" : "rounded-3xl"
      )}
    >
      <DashedCross size={size} />
      <CloudOff
        className="relative z-[1]"
        style={{ width: icon, height: icon }}
        strokeWidth={1.75}
        aria-hidden
      />
    </StrokeOrderUnavailableShell>
  );
};

export const StrokeOrderUnavailableWifiCircle = ({
  size,
  onRetry,
}: {
  size: number;
  onRetry: () => void;
}) => {
  const icon = strokeOrderIconSize(size);
  const ring = Math.round(Math.min(size * 0.55, icon * 2.4));
  return (
    <StrokeOrderUnavailableShell
      size={size}
      onRetry={onRetry}
      className={cn(
        "bg-muted hover:bg-muted/80",
        size < 100 ? "rounded-2xl" : "rounded-3xl"
      )}
    >
      <span
        className="flex items-center justify-center rounded-full bg-background/70 text-muted-foreground shadow-sm ring-1 ring-border/60"
        style={{ width: ring, height: ring }}
      >
        <WifiOff
          style={{ width: icon, height: icon }}
          strokeWidth={1.75}
          aria-hidden
        />
      </span>
    </StrokeOrderUnavailableShell>
  );
};
