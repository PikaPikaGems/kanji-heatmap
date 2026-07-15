import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const ToggleRow = ({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4">
    <Label htmlFor={id} className="text-sm cursor-pointer">
      {label}
    </Label>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </div>
);
