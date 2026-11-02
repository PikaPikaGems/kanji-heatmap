import { useId } from "react";
import type { MasteryCardKind } from "@/lib/engine/mastery-metrics";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { KIND_TITLES, MASTERY_CARD_KINDS } from "./mastery-tally";

export type MasteryKindFilter = Record<MasteryCardKind, boolean>;

/**
 * Which card types get a card, like the activity filters' checkboxes. The
 * last one checked can't be unchecked, so at least one card always shows.
 */
export const MasteryKindFilters = ({
  shown,
  onChange,
}: {
  shown: MasteryKindFilter;
  onChange: (kind: MasteryCardKind, checked: boolean) => void;
}) => {
  const idBase = useId();
  const checkedCount = MASTERY_CARD_KINDS.filter((kind) => shown[kind]).length;
  return (
    <div className="flex flex-wrap items-center justify-center mb-3 gap-x-5 gap-y-2">
      {MASTERY_CARD_KINDS.map((kind) => {
        const id = `${idBase}-${kind}`;
        const isLast = shown[kind] && checkedCount === 1;
        return (
          <div key={kind} className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={shown[kind]}
              disabled={isLast}
              onCheckedChange={(v) => onChange(kind, v === true)}
            />
            <Label
              htmlFor={id}
              className="text-xs font-semibold cursor-pointer"
              title={isLast ? "At least one card type stays shown" : undefined}
            >
              {KIND_TITLES[kind]}
            </Label>
          </div>
        );
      })}
    </div>
  );
};
