import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** A small labeled switch for an on/off preference. */
export const FlagSwitch = ({
  label,
  checked,
  onCheckedChange,
  className,
  labelClassName,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  className?: string;
  /** Overrides the label's default small bold text, e.g. a bigger size. */
  labelClassName?: string;
}) => {
  const id = useId();

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label
        htmlFor={id}
        className={cn("text-xs font-bold cursor-pointer", labelClassName)}
      >
        {label}
      </Label>
    </div>
  );
};
