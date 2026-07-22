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
  <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2.5 sm:gap-4">
    <Label
      htmlFor={id}
      className="min-w-0 flex-1 text-sm leading-snug cursor-pointer"
    >
      {label}
    </Label>
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      className="shrink-0"
    />
  </div>
);
