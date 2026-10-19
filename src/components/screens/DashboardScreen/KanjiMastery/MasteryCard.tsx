import {
  MASTERY_METRIC_TITLES,
  type MasteryCardKind,
  type MasteryMetric,
} from "@/lib/engine/mastery-metrics";
import { Table, TableBody } from "@/components/ui/table";
import { MasteryBarRow } from "./MasteryBarRow";
import {
  KIND_TITLES,
  type MasteryGroup,
  type MasteryTallies,
} from "./mastery-tally";

/** One card type + metric: a bar per group, then the total. */
export const MasteryCard = ({
  kind,
  metric,
  groups,
  tallies,
}: {
  kind: MasteryCardKind;
  metric: MasteryMetric;
  groups: readonly MasteryGroup[];
  tallies: MasteryTallies;
}) => {
  const cardTitle = `${KIND_TITLES[kind]} ${MASTERY_METRIC_TITLES[metric]}`;
  return (
    <section className="min-w-0 px-2 py-3 text-left border rounded-xl border-foreground/5 bg-muted/10">
      <h3 className="px-2 mb-1 text-sm font-bold">{cardTitle}</h3>
      <Table>
        <TableBody>
          {groups.map(({ key, label, cn }) => (
            <MasteryBarRow
              key={key}
              label={label}
              title={`${label} · ${cardTitle}`}
              dotCn={cn}
              counts={tallies.byGroup[key][metric][kind]}
              total={tallies.byGroup[key].total}
              measure={metric}
            />
          ))}
          <MasteryBarRow
            label="All"
            title={`All · ${cardTitle}`}
            counts={tallies.all[metric][kind]}
            total={tallies.all.total}
            measure={metric}
          />
        </TableBody>
      </Table>
    </section>
  );
};
