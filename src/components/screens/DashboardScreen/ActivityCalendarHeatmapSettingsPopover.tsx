import { useId } from "react";
import { Settings } from "lucide-react";
import { GenericPopover } from "@/components/common/GenericPopover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useActivityHeatmapSettings } from "@/hooks/use-activity-heatmap-settings";

export const ActivityCalendarHeatmapSettingsPopover = () => {
  const [{ vertical }, setSetting] = useActivityHeatmapSettings();
  const layoutSwitchId = useId();

  return (
    <GenericPopover
      contentClassName="m-0 p-0 max-w-56"
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="p-2 rounded-xl bg-background"
          aria-label="Activity heatmap settings bg-red-500"
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
              htmlFor={layoutSwitchId}
              className={
                !vertical ? "text-foreground font-semibold" : undefined
              }
            >
              Wide
            </Label>
            <Switch
              id={layoutSwitchId}
              checked={vertical}
              onCheckedChange={(checked) => setSetting("vertical", checked)}
              aria-label="Toggle compact activity heatmap"
            />
            <Label
              htmlFor={layoutSwitchId}
              className={vertical ? "text-foreground font-semibold" : undefined}
            >
              Compact
            </Label>
          </div>
        </div>
      }
    />
  );
};
