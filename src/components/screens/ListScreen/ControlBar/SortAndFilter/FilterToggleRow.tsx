import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const FilterToggleRow = ({
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
  <div className="flex items-center gap-3 rounded-md py-2.5 ">
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      className="shrink-0"
    />
    <Label
      htmlFor={id}
      className="flex-1 min-w-0 text-sm leading-snug cursor-pointer"
    >
      {label}
    </Label>
  </div>
);
