import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DefaultErrorFallback } from "@/components/error";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { PrimaryDataSources } from "@/components/common/PrimaryDataSources";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { useKanjiReadingDetails } from "@/providers/kanji-reading-category-hooks";
import {
  kandracPaperUrl,
  readingFrequencySourceLinks,
} from "@/lib/freq/freq-source-info";
import {
  frequencyColors,
  frequencyLabels,
  KanjiReadingEntry,
  readingTypeLabels,
} from "@/lib/kanji-section-constants";
import { TableSkeleton } from "./TableSkeleton";

const UsageCell = ({ entry }: { entry: KanjiReadingEntry }) => {
  const label = frequencyLabels[entry.frequency];
  if (!label) return <TableCell>?</TableCell>;

  return (
    <TableCell>
      <span className={`text-xs font-bold ${frequencyColors[entry.frequency]}`}>
        {entry.frequency} {label}
      </span>
    </TableCell>
  );
};

const ReadingRow = ({ entry }: { entry: KanjiReadingEntry }) => (
  <TableRow>
    <TableCell className="text-base kanji-font">
      <RomajiBadge kana={entry.reading} />
    </TableCell>
    <UsageCell entry={entry} />
    <TableCell className="text-base kanji-font">
      {entry.example_word == null ? (
        "-"
      ) : (
        <ExampleWordPopover word={entry.example_word} />
      )}
    </TableCell>
    <TableCell>
      <Badge
        variant={entry.type === "KUN" ? "secondary" : "default"}
        className="whitespace-nowrap"
      >
        {readingTypeLabels[entry.type]}
      </Badge>
    </TableCell>
  </TableRow>
);

export const ReadingFrequencyCategory = ({ kanji }: { kanji: string }) => {
  const { status, kanjiReadingData } = useKanjiReadingDetails(kanji);

  if (status === "idle" || status === "pending") return <TableSkeleton />;

  if (status === "error") {
    return (
      <DefaultErrorFallback message="Failed to load reading frequency data." />
    );
  }

  if (!kanjiReadingData?.length) {
    return (
      <div className="w-full p-4 text-base text-center">{`There is no reading usefulness data for ${kanji} right now.`}</div>
    );
  }

  return (
    <div className="animate-fade-in" key={kanji}>
      <div className="px-2 mt-4 -mx-2 overflow-x-auto text-left">
        <Table className="w-full min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Reading</TableHead>
              <TableHead className="text-left">Frequency</TableHead>
              <TableHead className="text-left">Sample Word</TableHead>
              <TableHead className="text-left">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kanjiReadingData.map((entry) => (
              <ReadingRow
                key={`${entry.reading}-${entry.example_word}-${entry.frequency}-${entry.type}`}
                entry={entry}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-2 text-xs text-left">
        <p className="my-4">
          This data comes from Dr. Patrick {`Kandrac's`} research on reading
          frequency in common vocabulary.
          <ExternalTextLink text="View full paper." href={kandracPaperUrl} />
        </p>
        <PrimaryDataSources links={readingFrequencySourceLinks} />
      </div>
    </div>
  );
};
