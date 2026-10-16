import { CircleHelp } from "lucide-react";
import { GenericPopover } from "@/components/common/GenericPopover";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * One "Also remove from this device" checkbox. The box toggles it; the label
 * text and its (?) icon are one button that opens the details, so they work
 * on touch too (no hover needed).
 */
export const LogoutRemovalOption = ({
  label,
  details,
  checked,
  onCheckedChange,
}: {
  label: string;
  details: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div className="flex items-start gap-3">
    <Checkbox
      className="mt-0.5"
      aria-label={label}
      checked={checked}
      onCheckedChange={(next) => onCheckedChange(next === true)}
    />
    <GenericPopover
      // The logout modal is itself modal; without this the popover couldn't be clicked.
      modal
      focusOnOpen={false}
      contentClassName="z-[60] w-64 p-3"
      trigger={
        <button
          type="button"
          className="text-sm font-medium text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {label}
          <CircleHelp
            aria-hidden
            className="inline-block ml-1 align-[-2px] size-3.5 text-muted-foreground"
          />
        </button>
      }
      content={<p className="text-xs text-left">{details}</p>}
    />
  </div>
);
