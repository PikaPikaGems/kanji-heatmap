import { useId, type ReactNode } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GenericPopover } from "@/components/common/GenericPopover";
import { GradientLegend } from "@/components/common/GradientLegend";

/** The Wide / Compact switch, plus any extra options. */
const HeatmapSettingsPopover = ({
  name,
  compact,
  onChange,
  children,
}: {
  /** The heatmap's name, for screen readers. */
  name: string;
  compact: boolean;
  onChange: (compact: boolean) => void;
  children?: ReactNode;
}) => {
  const switchId = useId();
  return (
    <GenericPopover
      contentClassName="m-0 p-0 max-w-56"
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="p-2 rounded-xl bg-background"
          aria-label={`${name} heatmap settings`}
        >
          <Settings className="size-2" />
        </Button>
      }
      content={
        <div className="p-5 space-y-3 text-left">
          <div className="text-xs font-extrabold uppercase text-muted-foreground">
            Layout
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Label
              htmlFor={switchId}
              className={!compact ? "text-foreground font-semibold" : undefined}
            >
              Wide
            </Label>
            <Switch
              id={switchId}
              checked={compact}
              onCheckedChange={onChange}
              aria-label={`Toggle compact ${name} heatmap`}
            />
            <Label
              htmlFor={switchId}
              className={compact ? "text-foreground font-semibold" : undefined}
            >
              Compact
            </Label>
          </div>
          {children && (
            <div className="pt-3 border-t border-dotted">{children}</div>
          )}
        </div>
      }
    />
  );
};

/**
 * Every dashboard heatmap's footer: the gradient legend, then its settings
 * button. One component so the heatmaps keep the same spacing and controls.
 */
export const HeatmapLegendRow = ({
  name,
  lessLabel,
  moreLabel,
  compact,
  onCompactChange,
  children,
}: {
  /** The heatmap's name, for screen readers. */
  name: string;
  lessLabel?: string;
  moreLabel?: string;
  compact: boolean;
  onCompactChange: (compact: boolean) => void;
  /** Extra settings under the layout switch. */
  children?: ReactNode;
}) => (
  <div className="flex items-center justify-center w-full mt-4">
    <div className="flex items-center gap-1">
      <GradientLegend lessLabel={lessLabel} moreLabel={moreLabel} /> ·
      <HeatmapSettingsPopover
        name={name}
        compact={compact}
        onChange={onCompactChange}
      >
        {children}
      </HeatmapSettingsPopover>
    </div>
  </div>
);
