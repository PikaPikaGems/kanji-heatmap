import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const FilterToggleRow = ({
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
  <div className="flex items-center gap-3 rounded-md py-2.5 ">
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      className="shrink-0"
    />
    <div className="flex-1 min-w-0">
      <Label
        htmlFor={id}
        className={
          disabled
            ? "block text-sm leading-snug"
            : "block text-sm leading-snug cursor-pointer"
        }
      >
        {label}
      </Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  </div>
);
