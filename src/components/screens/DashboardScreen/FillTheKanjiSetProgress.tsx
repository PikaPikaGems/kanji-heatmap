import { BookOpenCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatRawCount } from "@/lib/format-count";
import {
  FILL_THE_KANJI_SETS,
  FillTheKanjiSetId,
} from "@/lib/fill-the-kanji/sets";
import { setRowCount } from "@/lib/fill-the-kanji/batches";
import { SetBatchStats, rowsSeen } from "@/lib/fill-the-kanji/storage";
import { OverviewCaption } from "./ActivityStatCard";

/**
 * One thin bar per set (phrases seen / phrases in the set), like the
 * Bookmarks breakdown, then the total across every set.
 */
export const FillTheKanjiSetProgress = ({
  statsById,
}: {
  statsById: Map<FillTheKanjiSetId, SetBatchStats>;
}) => {
  const rows = FILL_THE_KANJI_SETS.map(({ id, label }) => ({
    id,
    label,
    seen: rowsSeen(id, statsById.get(id) ?? {}),
    total: setRowCount(id),
  }));
  const totalSeen = rows.reduce((sum, row) => sum + row.seen, 0);

  return (
    <div>
      <Table>
        <TableBody>
          {rows.map(({ id, label, seen, total }) => (
            <TableRow key={id} className="p-0 my-1 text-left">
              <TableCell className="p-0">
                <span className="block py-1 pl-2 mr-2 text-xs font-extrabold whitespace-nowrap">
                  {label}
                </span>
              </TableCell>
              <TableCell className="w-full px-0 py-2">
                <Progress
                  className="h-1"
                  value={total > 0 ? (seen / total) * 100 : 0}
                  primitiveCn="background-theme-color-with-opacity-100"
                  aria-label={`${label}: ${seen} of ${total} phrases seen`}
                />
              </TableCell>
              <TableCell className="p-0 text-[10px] tabular-nums">
                <span className="inline-block min-w-20 -mb-0_5 text-end">
                  {formatRawCount(seen)} / {formatRawCount(total)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-4">
        <OverviewCaption
          Icon={BookOpenCheck}
          label="Total phrases seen"
          value={formatRawCount(totalSeen)}
        />
      </div>
    </div>
  );
};
