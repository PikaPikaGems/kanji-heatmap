import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const ToggleRow = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  hint,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Short note under the label, e.g. why the switch is disabled. */
  hint?: string | null;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="text-left">
      <Label
        htmlFor={id}
        className={disabled ? "text-sm" : "text-sm cursor-pointer"}
      >
        {label}
      </Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
    />
  </div>
);
