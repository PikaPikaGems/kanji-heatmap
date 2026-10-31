import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * A switch between two named sides ("JLPT ○ Jouyou"); the side that is on
 * reads bold. `checked` means the right side.
 */
export const TwoWaySwitch = ({
  left,
  right,
  checked,
  onCheckedChange,
  ariaLabel,
  className,
}: {
  left: string;
  right: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
  /** Centered by default; e.g. `justify-start` to left-align. */
  className?: string;
}) => {
  const id = useId();
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-xs text-muted-foreground",
        className
      )}
    >
      <Label
        htmlFor={id}
        className={!checked ? "text-foreground font-semibold" : undefined}
      >
        {left}
      </Label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={ariaLabel}
      />
      <Label
        htmlFor={id}
        className={checked ? "text-foreground font-semibold" : undefined}
      >
        {right}
      </Label>
    </div>
  );
};
