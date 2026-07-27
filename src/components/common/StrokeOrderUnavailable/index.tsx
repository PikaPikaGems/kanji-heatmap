import {
  STROKE_ORDER_UNAVAILABLE_VARIANT,
  StrokeOrderUnavailableAlertDashed,
  StrokeOrderUnavailableFlameDashed,
  StrokeOrderUnavailableQuestionDashed,
  StrokeOrderUnavailableTurtleDashed,
  type StrokeOrderUnavailableVariant,
} from "./variants";

export type { StrokeOrderUnavailableVariant };
export {
  STROKE_ORDER_UNAVAILABLE_VARIANT,
  StrokeOrderUnavailableAlertDashed,
  StrokeOrderUnavailableFlameDashed,
  StrokeOrderUnavailableQuestionDashed,
  StrokeOrderUnavailableTurtleDashed,
} from "./variants";

export const STROKE_ORDER_UNAVAILABLE_VARIANTS: StrokeOrderUnavailableVariant[] =
  ["question-dashed", "flame-dashed", "alert-dashed", "turtle-dashed"];

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
    case "flame-dashed":
      return (
        <StrokeOrderUnavailableFlameDashed size={size} onRetry={onRetry} />
      );
    case "alert-dashed":
      return (
        <StrokeOrderUnavailableAlertDashed size={size} onRetry={onRetry} />
      );
    case "turtle-dashed":
      return (
        <StrokeOrderUnavailableTurtleDashed size={size} onRetry={onRetry} />
      );
    case "question-dashed":
    default:
      return (
        <StrokeOrderUnavailableQuestionDashed size={size} onRetry={onRetry} />
      );
  }
};

/**
 * Side-by-side preview of every variant at several sizes.
 * Temporary page: `/gallery`
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
        Transparent box + dashed axes + icon. Click any box to exercise retry.
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
