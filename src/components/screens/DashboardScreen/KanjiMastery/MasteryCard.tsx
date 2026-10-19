import type { ReactNode } from "react";
import type {
  MasteryCardKind,
  MasteryMetric,
} from "@/lib/engine/mastery-metrics";
import { Table, TableBody } from "@/components/ui/table";
import { MasteryBarRow } from "./MasteryBarRow";
import {
  MASTERY_CARD_KINDS,
  type MasteryGroup,
  type MasteryTallies,
} from "./mastery-tally";

const KIND_TITLES: Record<MasteryCardKind, string> = {
  reading: "Reading",
  writing: "Writing",
  combined: "Combined",
};

const CardFrame = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="min-w-0 px-2 py-3 text-left border rounded-xl border-foreground/5 bg-muted/10">
    <h3 className="px-2 mb-1 text-sm font-bold">{title}</h3>
    <Table>
      <TableBody>{children}</TableBody>
    </Table>
  </section>
);

/** Every card type over all kanji: one thicker bar each. */
export const MasteryTotalsCard = ({
  metric,
  tallies,
}: {
  metric: MasteryMetric;
  tallies: MasteryTallies;
}) => (
  <CardFrame title="All Kanji">
    {MASTERY_CARD_KINDS.map((kind) => (
      <MasteryBarRow
        key={kind}
        label={KIND_TITLES[kind]}
        counts={tallies.all[metric][kind]}
        total={tallies.all.total}
        measure={metric}
        thick={true}
      />
    ))}
  </CardFrame>
);

/** One card type: a bar per level (JLPT level or Jouyou grade). */
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
}) => (
  <CardFrame title={`${KIND_TITLES[kind]} by Level`}>
    {groups.map(({ key, label, cn }) => (
      <MasteryBarRow
        key={key}
        label={label}
        dotCn={cn}
        counts={tallies.byGroup[key][metric][kind]}
        total={tallies.byGroup[key].total}
        measure={metric}
      />
    ))}
  </CardFrame>
);
