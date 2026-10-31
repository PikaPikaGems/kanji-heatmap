import { useId } from "react";
import {
  ACTIVITY_KIND_GROUPS,
  ACTIVITY_KIND_LABELS,
  ActivityKind,
  ActivityKindFilters,
} from "@/lib/activity";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const KindCheckbox = ({
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
  <div className="flex items-center gap-2">
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(v) => onChange(v === true)}
    />
    <Label htmlFor={id} className="text-xs font-semibold cursor-pointer">
      {label}
    </Label>
  </div>
);

/**
 * The heatmap's activity checkboxes in groups (Kanji Mastery, Practice
 * Games, Review Pile), each group with an "All" checkbox when it has more
 * than one. `onChange` gets every kind that changed at once.
 */
export const ActivityKindFiltersRow = ({
  filters,
  onChange,
}: {
  filters: ActivityKindFilters;
  onChange: (changes: Partial<Record<ActivityKind, boolean>>) => void;
}) => {
  const idBase = useId();
  return (
    <div className="flex flex-col items-center gap-3">
      {ACTIVITY_KIND_GROUPS.map(({ heading, kinds }) => {
        // Checked when the whole group is; checking it turns the group on.
        const allChecked = kinds.every((kind) => filters[kind]);
        return (
          <fieldset key={heading} className="flex flex-col items-center">
            <legend className="mb-1.5 text-[10px] font-bold tracking-wider text-center uppercase text-muted-foreground">
              {heading}
            </legend>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {kinds.length > 1 && (
                <KindCheckbox
                  id={`${idBase}-${heading}-all`}
                  label="All"
                  checked={allChecked}
                  onChange={(checked) =>
                    onChange(
                      Object.fromEntries(kinds.map((kind) => [kind, checked]))
                    )
                  }
                />
              )}
              {kinds.map((kind) => (
                <KindCheckbox
                  key={kind}
                  id={`${idBase}-${kind}`}
                  label={ACTIVITY_KIND_LABELS[kind]}
                  checked={filters[kind]}
                  onChange={(checked) => onChange({ [kind]: checked })}
                />
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
};
