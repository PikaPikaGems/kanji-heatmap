import { InfoIcon } from "@/components/icons";
import { GenericPopover } from "@/components/common/GenericPopover";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { FlagSwitch } from "@/components/common/FlagSwitch";
import { useLocalStorageFlag } from "@/hooks/use-local-storage";
import {
  ANCHOR_RANK_BAR_MAX,
  ANCHOR_RANK_SOURCES,
  anchorRankProgress,
  isPastShortList,
  type AnchorRankSource,
} from "@/lib/kanji/anchor-words";

/** Whether anchor words show their frequency ranks. Off by default. */
const SHOW_ANCHOR_RANKS_KEY = "show-anchor-word-frequency-ranks";

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
          ? `Not in its top ${source.cap.toLocaleString()}`
          : `#${rank.toLocaleString()}`}
      </SourceFact>
    </dl>
    <p className="text-muted-foreground text-pretty">
      1 is the most frequent. Only this list&apos;s top{" "}
      {source.cap.toLocaleString()} words are used (rarer ones are seen too few
      times to rank reliably). Every list&apos;s bar uses the same scale: full
      at #1, empty from #{ANCHOR_RANK_BAR_MAX.toLocaleString()}.
    </p>
    {source.cap < ANCHOR_RANK_BAR_MAX && (
      <p className="text-muted-foreground text-pretty">
        This list is small, so it stops at #{source.cap.toLocaleString()}. A
        word past it gets a dotted bar: it may still be fairly common.
      </p>
    )}
    <div>
      <ExternalTextLink href={source.url} text="Visit the source" />
    </div>
  </div>
);

/**
 * An anchor word's rank in each of the 17 frequency lists, laid out like the
 * kanji's Frequency Ranks: the list's name and the rank, then a bar that is
 * full at #1 and empty from #16,000 (or when the word isn't ranked). A word
 * past a small list's end (CEJC: 11,000) gets a dotted bar instead of an empty
 * one. Nothing when the word is in none of the lists. Hidden behind a "Show
 * Frequency Ranks" switch that is off by default and remembered across kanji.
 */
export const AnchorWordFrequencyRanks = ({
  word,
  ranks,
}: {
  word: string;
  ranks: number[];
}) => {
  const [shown, setShown] = useLocalStorageFlag(SHOW_ANCHOR_RANKS_KEY);

  if (ranks.every((rank) => rank === -1)) return null;

  return (
    <div className="text-left">
      <FlagSwitch
        label="Show Frequency Ranks"
        checked={shown}
        onCheckedChange={setShown}
        className="px-2 pt-2 mb-6"
        labelClassName="text-sm"
      />
      {shown && (
        <Table className="my-2 animate-fade-in-fast">
          <TableBody>
            {ANCHOR_RANK_SOURCES.map((source, i) => {
              const { label } = source;
              const rank = ranks[i] ?? -1;
              const pastShortList = isPastShortList(source, rank);
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
                            <span className="shrink-0 tabular-nums">
                              #{rank}
                            </span>
                          )}
                          {pastShortList && (
                            <span className="font-normal shrink-0 tabular-nums text-muted-foreground">
                              &gt;#{source.cap.toLocaleString()}
                            </span>
                          )}
                        </button>
                      }
                      content={
                        <SourceDetails
                          source={source}
                          word={word}
                          rank={rank}
                        />
                      }
                    />
                  </TableCell>
                  <TableCell className="w-full py-2 pl-2 pr-0">
                    {pastShortList ? (
                      <div
                        className="border-t-2 border-dotted border-muted-foreground/60"
                        aria-label={`Past this list's top ${source.cap.toLocaleString()}`}
                      />
                    ) : (
                      <Progress
                        className="h-1"
                        value={anchorRankProgress(rank)}
                        primitiveCn="background-theme-color-with-opacity-100"
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
