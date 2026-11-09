import { InfoIcon } from "@/components/icons";
import { GenericPopover } from "@/components/common/GenericPopover";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import {
  ANCHOR_RANK_BAR_MAX,
  ANCHOR_RANK_LIST_CAP,
  ANCHOR_RANK_SOURCES,
  anchorRankProgress,
  type AnchorRankSource,
} from "@/lib/kanji/anchor-words";

/** One "Size: …" line of a list's popover. */
const SourceFact = ({ term, children }: { term: string; children: string }) => (
  <div className="flex gap-2">
    <dt className="w-16 font-bold shrink-0 text-muted-foreground">{term}</dt>
    <dd className="min-w-0 text-pretty">{children}</dd>
  </div>
);

/**
 * What a list is: its name, what it counts, how big it is and where its text
 * comes from, the word's rank in it, then how the rank and bar read.
 */
const SourceDetails = ({
  source,
  word,
  rank,
}: {
  source: AnchorRankSource;
  word: string;
  rank: number;
}) => (
  <div className="flex flex-col gap-2 px-4 py-3 text-xs text-left w-72">
    <p className="text-sm font-bold">{source.label}</p>
    <p className="text-pretty">{source.description}</p>
    <dl className="flex flex-col gap-1 py-2 border-dotted border-y">
      <SourceFact term="Size">{source.size}</SourceFact>
      {source.coverage && (
        <SourceFact term="Text">{source.coverage}</SourceFact>
      )}
      <SourceFact term={word}>
        {rank === -1
          ? `Not in its top ${ANCHOR_RANK_LIST_CAP.toLocaleString()}`
          : `#${rank.toLocaleString()}`}
      </SourceFact>
    </dl>
    <p className="text-muted-foreground text-pretty">
      1 is the most frequent. Only each list&apos;s top{" "}
      {ANCHOR_RANK_LIST_CAP.toLocaleString()} words are used, and the bar is
      empty from #{ANCHOR_RANK_BAR_MAX.toLocaleString()}.
    </p>
    <div>
      <ExternalTextLink href={source.url} text="Visit the source" />
    </div>
  </div>
);

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
          {ANCHOR_RANK_SOURCES.map((source, i) => {
            const { label } = source;
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
                      <SourceDetails source={source} word={word} rank={rank} />
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
