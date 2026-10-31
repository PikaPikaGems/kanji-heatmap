import { InfoIcon } from "@/components/icons";
import { GenericPopover } from "@/components/common/GenericPopover";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  ANCHOR_RANK_BAR_MAX,
  ANCHOR_RANK_SOURCES,
  anchorRankProgress,
} from "@/lib/kanji/anchor-words";

/**
 * An anchor word's rank in each of the 15 frequency lists, laid out like the
 * kanji's Frequency Ranks: the list's name and the rank, then a bar that is
 * full at #1 and empty from #15,000 (or when the word isn't ranked). Nothing
 * when the word is in none of the lists.
 */
export const AnchorWordFrequencyRanks = ({
  word,
  ranks,
}: {
  word: string;
  ranks: number[];
}) => {
  if (ranks.every((rank) => rank === -1)) return null;

  return (
    <div className="text-left">
      <p className="px-2 pt-2 text-base">
        Frequency Ranks: <span className="kanji-font">{word}</span>
      </p>
      <Table className="my-2">
        <TableBody>
          {ANCHOR_RANK_SOURCES.map(({ label, description }, i) => {
            const rank = ranks[i] ?? -1;
            return (
              <TableRow key={label} className="p-0 my-1 text-left">
                <TableCell className="p-0">
                  <GenericPopover
                    trigger={
                      <button className="pl-2 text-left text-xs flex justify-between items-center gap-2 w-[200px] lg:w-[260px] py-1">
                        <span className="font-extrabold">
                          {label}{" "}
                          <InfoIcon className="inline-block" size={12} />
                        </span>
                        {rank !== -1 && (
                          <span className="shrink-0 tabular-nums">#{rank}</span>
                        )}
                      </button>
                    }
                    content={
                      <div className="p-3 text-xs w-72">
                        <p>{description}</p>
                        <p className="pt-2 text-muted-foreground">
                          1 is the most frequent. The bar is empty from #
                          {ANCHOR_RANK_BAR_MAX.toLocaleString()} and for words
                          that aren&apos;t in the list&apos;s top 25,000.
                        </p>
                      </div>
                    }
                  />
                </TableCell>
                <TableCell className="w-full py-2 pl-2 pr-0">
                  <Progress
                    className="h-1"
                    value={anchorRankProgress(rank)}
                    primitiveCn="background-theme-color-with-opacity-100"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
