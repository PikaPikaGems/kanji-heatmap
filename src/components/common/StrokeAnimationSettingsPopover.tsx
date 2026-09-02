import { Settings } from "lucide-react";
import { GenericPopover } from "@/components/common/GenericPopover";
import { StrokeAnimationSettingsFields } from "@/components/common/StrokeAnimationSettingsFields";
import { Button } from "@/components/ui/button";

export const StrokeAnimationSettingsPopover = () => (
  <GenericPopover
    modal={true}
    showArrow
    contentClassName="z-[60] w-[min(100vw-2rem,20rem)] p-0"
    trigger={
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="p-4 border-2 border-dashed rounded-xl bg-background"
        aria-label="Stroke order animation settings"
      >
        <Settings className="size-8" />
      </Button>
    }
    content={
      <div className="p-4 space-y-3">
        <div className="pb-1 mb-4 text-xs font-extrabold tracking-widest uppercase border-b text-muted-foreground">
          Stroke animation
        </div>
        <StrokeAnimationSettingsFields />
      </div>
    }
  />
);
