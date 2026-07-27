import {
  STROKE_ORDER_UNAVAILABLE_VARIANT,
  StrokeOrderUnavailableCloudDashed,
  StrokeOrderUnavailableWifiBare,
  StrokeOrderUnavailableWifiCircle,
  StrokeOrderUnavailableWifiDashed,
  StrokeOrderUnavailableWifiMuted,
  type StrokeOrderUnavailableVariant,
} from "./variants";

export type { StrokeOrderUnavailableVariant };
export {
  STROKE_ORDER_UNAVAILABLE_VARIANT,
  StrokeOrderUnavailableCloudDashed,
  StrokeOrderUnavailableWifiBare,
  StrokeOrderUnavailableWifiCircle,
  StrokeOrderUnavailableWifiDashed,
  StrokeOrderUnavailableWifiMuted,
} from "./variants";

export const STROKE_ORDER_UNAVAILABLE_VARIANTS: StrokeOrderUnavailableVariant[] =
  ["wifi-dashed", "wifi-muted", "wifi-bare", "cloud-dashed", "wifi-circle"];

type Props = {
  size: number;
  onRetry: () => void;
  /** Defaults to STROKE_ORDER_UNAVAILABLE_VARIANT — change that constant to swap globally. */
  variant?: StrokeOrderUnavailableVariant;
};

/** Icon-only empty state when the kanji stroke SVG cannot be fetched. Click retries. */
export const StrokeOrderUnavailable = ({
  size,
  onRetry,
  variant = STROKE_ORDER_UNAVAILABLE_VARIANT,
}: Props) => {
  switch (variant) {
    case "wifi-muted":
      return <StrokeOrderUnavailableWifiMuted size={size} onRetry={onRetry} />;
    case "wifi-bare":
      return <StrokeOrderUnavailableWifiBare size={size} onRetry={onRetry} />;
    case "cloud-dashed":
      return (
        <StrokeOrderUnavailableCloudDashed size={size} onRetry={onRetry} />
      );
    case "wifi-circle":
      return <StrokeOrderUnavailableWifiCircle size={size} onRetry={onRetry} />;
    case "wifi-dashed":
    default:
      return <StrokeOrderUnavailableWifiDashed size={size} onRetry={onRetry} />;
  }
};

/**
 * Side-by-side preview of every variant at several sizes.
 * Drop temporarily into a screen to compare, e.g.:
 *   import { StrokeOrderUnavailableGallery } from "@/components/common/StrokeOrderUnavailable";
 *   // …render <StrokeOrderUnavailableGallery />
 */
export const StrokeOrderUnavailableGallery = ({
  onRetry = () => undefined,
}: {
  onRetry?: () => void;
} = {}) => {
  const sizes = [310, 160, 85] as const;
  return (
    <div className="flex flex-col gap-8 p-4">
      <p className="text-sm text-muted-foreground">
        Stroke-order unavailable fallbacks — click any box to exercise retry.
        Set <code className="text-xs">STROKE_ORDER_UNAVAILABLE_VARIANT</code> in{" "}
        <code className="text-xs">variants.tsx</code> to pick one globally.
      </p>
      {STROKE_ORDER_UNAVAILABLE_VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-col gap-3">
          <div className="text-sm font-medium">{variant}</div>
          <div className="flex flex-wrap items-end gap-4">
            {sizes.map((size) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <StrokeOrderUnavailable
                  size={size}
                  variant={variant}
                  onRetry={onRetry}
                />
                <span className="text-xs text-muted-foreground">{size}px</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
