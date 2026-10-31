import { GenericPopover } from "@/components/common/GenericPopover";
import { InfoIcon } from "@/components/icons";
import { FreqSquare } from "@/components/common/freq/FreqSquare";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import {
  getBands,
  MEASURE_INTROS,
  NEW_LABEL,
  NEW_RULES,
} from "@/lib/engine/mastery-heatmap-metrics";
import type { MasteryMetric } from "@/lib/engine/mastery-metrics";
import { cn } from "@/lib/utils";

/** A swatch, the band's name, and what puts a card in it. */
const BandRow = ({
  label,
  rule,
  fillCn,
}: {
  label: string;
  rule: string;
  fillCn: string;
}) => (
  <li className="flex gap-2">
    <span aria-hidden className="inline-flex mt-px shrink-0">
      <FreqSquare srOnly="" cn={fillCn} />
    </span>
    <div className="min-w-0 text-xs leading-snug">
      <div className="font-bold">{label}</div>
      <div className="text-muted-foreground">{rule}</div>
    </div>
  </li>
);

/** "New", then the measure's four bands, dullest first. */
export const BandRows = ({ measure }: { measure: MasteryMetric }) => (
  <ul className="flex flex-col gap-1.5">
    <BandRow
      label={NEW_LABEL}
      rule={NEW_RULES[measure]}
      fillCn={getBandFillCn(measure, null)}
    />
    {getBands(measure).map(({ label, rule }, band) => (
      <BandRow
        key={label}
        label={label}
        rule={rule}
        fillCn={getBandFillCn(measure, band)}
      />
    ))}
  </ul>
);

const getCombinedNote = (measure: MasteryMetric): string => {
  const pick = measure === "difficulty" ? "hardest" : "weakest";
  return `Combined counts once every card of a kanji is reviewed (Writing, Reading I and, when it has a second word, Reading II), and shows the ${pick} of them.`;
};

/**
 * The measure's one-line meaning; its ⓘ opens what each square means (and,
 * for a combined metric, how its cards combine).
 */
export const MeasureIntro = ({
  measure,
  combined,
  className,
}: {
  measure: MasteryMetric;
  combined: boolean;
  className?: string;
}) => (
  <GenericPopover
    trigger={
      <button
        type="button"
        className={cn(
          "text-xs text-left rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        {MEASURE_INTROS[measure]}
        {/* No-break space: the icon never wraps onto a line of its own. */}
        {"\u00a0"}
        <InfoIcon className="inline-block -translate-y-px" size={12} />
      </button>
    }
    content={
      <div className="px-4 py-3 text-left w-72">
        <BandRows measure={measure} />
        {combined && (
          <p className="pt-2 mt-3 text-xs border-t border-dotted text-muted-foreground">
            {getCombinedNote(measure)}
          </p>
        )}
      </div>
    }
  />
);
