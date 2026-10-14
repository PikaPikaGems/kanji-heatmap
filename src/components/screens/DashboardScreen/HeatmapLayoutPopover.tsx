import { useId, type ReactNode } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GenericPopover } from "@/components/common/GenericPopover";

/** Settings button beside a heatmap's legend: the Wide / Compact switch, plus any extra options. */
export const HeatmapLayoutPopover = ({
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
