import {
  ACTIVITY_KIND_LABELS,
  ActivityKind,
  ALL_ACTIVITY_KINDS,
  ActivityKindFilters,
} from "@/lib/activity";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const ActivityKindFiltersRow = ({
  filters,
  onChange,
}: {
  filters: ActivityKindFilters;
  onChange: (kind: ActivityKind, checked: boolean) => void;
}) => (
  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
    {ALL_ACTIVITY_KINDS.map((kind) => {
      const id = `activity-kind-${kind}`;
      return (
        <div key={kind} className="flex items-center gap-2">
          <Checkbox
            id={id}
            checked={filters[kind]}
            onCheckedChange={(v) => onChange(kind, v === true)}
          />
          <Label htmlFor={id} className="cursor-pointer text-sm font-semibold">
            {ACTIVITY_KIND_LABELS[kind]}
          </Label>
        </div>
      );
    })}
  </div>
);
