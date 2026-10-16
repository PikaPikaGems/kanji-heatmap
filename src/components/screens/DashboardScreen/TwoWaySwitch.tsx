import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
}: {
  left: string;
  right: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
}) => {
  const id = useId();
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
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
