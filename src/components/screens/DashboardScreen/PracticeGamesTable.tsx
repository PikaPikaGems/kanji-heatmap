import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ActivityKind, ActivityStats } from "@/lib/activity";
import {
  fillTheKanjiPageMeta,
  productionPracticePageMeta,
  recognitionPractice2PageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/lib/pages/practice-pages";
import { formatCompactCount, formatRawCount } from "@/lib/format-count";
import { GAME_ICONS } from "@/lib/pages/nav-links";
import { cn } from "@/lib/utils";
import { StatValue } from "./ActivityStatCard";

const ROUNDS = { unit: "rounds", unitSingular: "round" };

/** The practice games, in the menu's order. */
const ROWS: {
  kind: ActivityKind;
  title: string;
  Icon: LucideIcon;
  unit: string;
  unitSingular: string;
}[] = [
  {
    kind: "fillTheKanji",
    title: fillTheKanjiPageMeta.shortLabel,
    Icon: GAME_ICONS.fillTheKanji,
    unit: "batches",
    unitSingular: "batch",
  },
  {
    kind: "speedKatakana",
    title: speedKatakanaPageMeta.shortLabel,
    Icon: GAME_ICONS.speedKatakana,
    unit: "sessions",
    unitSingular: "session",
  },
  {
    kind: "production",
    title: productionPracticePageMeta.shortLabel,
    Icon: GAME_ICONS.writingPractice,
    ...ROUNDS,
  },
  {
    kind: "recognition",
    title: recognitionPracticePageMeta.shortLabel,
    Icon: GAME_ICONS.readingPractice,
    ...ROUNDS,
  },
  {
    kind: "recognition2",
    title: recognitionPractice2PageMeta.shortLabel,
    Icon: GAME_ICONS.readingPractice,
    ...ROUNDS,
  },
];

const Count = ({ value }: { value: number }) => (
  <StatValue
    display={formatCompactCount(value)}
    raw={formatRawCount(value)}
    abbreviated={value >= 1000}
    className="text-sm font-bold"
  />
);

/** The table's frame and header; the rows come as children. */
const TableShell = ({ children }: { children: ReactNode }) => (
  <div className="h-full px-3 py-1.5 border rounded-xl border-foreground/5 bg-muted/10">
    <table className="w-full h-full text-xs">
      <thead>
        <tr className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground border-b border-dashed">
          <th className="py-1.5 font-bold text-left" colSpan={2}>
            Practice Games
          </th>
          <th className="w-12 py-1.5 font-bold text-right">Days</th>
          <th className="w-24 py-1.5 font-bold text-right">Played</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

/**
 * The practice games' days and rounds / batches / sessions as one quiet
 * table, so the mastery cards lead. A game with no days is dimmed.
 */
export const PracticeGamesTable = ({ stats }: { stats: ActivityStats }) => (
  <TableShell>
    {ROWS.map(({ kind, title, Icon, unit, unitSingular }) => {
      const { days, count } = stats.kinds[kind];
      return (
        <tr key={kind} className={cn(days === 0 && "opacity-40")}>
          <td className="w-6 py-1.5 text-foreground/65">
            <Icon className="size-3.5" aria-hidden />
          </td>
          <td className="py-1.5 pr-2 text-left">{title}</td>
          <td className="py-1.5 text-right tabular-nums">
            <Count value={days} />
          </td>
          <td className="py-1.5 text-right tabular-nums whitespace-nowrap">
            <span className="inline-flex items-baseline justify-end gap-1">
              <Count value={count} />
              <span className="text-[10px] text-muted-foreground">
                {count === 1 ? unitSingular : unit}
              </span>
            </span>
          </td>
        </tr>
      );
    })}
  </TableShell>
);

/** The table with pulsing placeholders, while the counts load. */
export const PracticeGamesTableSkeleton = () => (
  <TableShell>
    {ROWS.map(({ kind }) => (
      <tr key={kind} className="animate-pulse">
        <td className="w-6 py-2">
          <div className="rounded size-3.5 bg-muted" />
        </td>
        <td className="py-2">
          <div className="w-28 h-3 rounded-full bg-muted" />
        </td>
        <td className="py-2">
          <div className="w-4 h-3 ml-auto rounded-full bg-muted" />
        </td>
        <td className="py-2">
          <div className="w-16 h-3 ml-auto rounded-full bg-muted" />
        </td>
      </tr>
    ))}
  </TableShell>
);
