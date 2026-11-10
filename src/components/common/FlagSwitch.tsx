import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** A small labeled switch for an on/off preference. */
export const FlagSwitch = ({
  label,
  checked,
  onCheckedChange,
  className,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  className?: string;
}) => {
  const id = useId();

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="text-xs font-bold cursor-pointer">
        {label}
      </Label>
    </div>
  );
};
