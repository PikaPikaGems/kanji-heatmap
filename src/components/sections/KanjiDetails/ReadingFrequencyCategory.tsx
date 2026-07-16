import { useKanjiReadingDetails } from "@/providers/kanji-reading-category-provider";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BasicLoading } from "@/components/common/BasicLoading";
import { DefaultErrorFallback } from "@/components/error";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import {
  kandracPaperUrl,
  readingFrequencySourceLinks,
} from "@/lib/freq/freq-source-info";
import { PrimaryDataSources } from "@/components/common/PrimaryDataSources";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import {
  FrequencyCategory,
  frequencyColors,
  frequencyLabels,
  KanjiReadingEntry,
  readingTypeLabels,
} from "@/lib/kanji-section-constants";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";

const FrequencyBadge = ({ frequency }: { frequency: FrequencyCategory }) => {
  const label = frequencyLabels[frequency];
  const colorClass = frequencyColors[frequency];

  return (
    <span className={`text-xs font-bold ${colorClass}`}>
      {frequency} {label}
    </span>
  );
};

const ReadingTypeBadge = ({ type }: { type: "ON" | "KUN" }) => {
  const variant = type === "ON" ? "default" : "secondary";
  return (
    <Badge variant={variant} className="text-xs">
      {readingTypeLabels[type]}
    </Badge>
  );
};

const ReadingRow = ({ entry }: { entry: KanjiReadingEntry }) => {
  return (
    <TableRow>
      <TableCell className="text-base kanji-font">
        <RomajiBadge kana={entry.reading} />
      </TableCell>
      <TableCell>
        <FrequencyBadge frequency={entry.frequency} />
      </TableCell>
      <TableCell>
        {entry.example_word ? (
          <ExampleWordPopover word={entry.example_word} />
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>
        <ReadingTypeBadge type={entry.type} />
      </TableCell>
    </TableRow>
  );
};

export const ReadingFrequencyCategory = ({ kanji }: { kanji: string }) => {
  const { status, error, kanjiReadingData } = useKanjiReadingDetails(kanji);

  if (status === "pending" || status === "idle") {
    return <BasicLoading />;
  }

  if (status === "error" || error) {
    return (
      <DefaultErrorFallback message="Failed to load reading frequency data." />
    );
  }

  if (!kanjiReadingData || kanjiReadingData.length === 0) {
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
              <TableHead className="text-left">Type </TableHead>
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
        <p className="mb-4">
          All data and the methodology used to determine the reading frequency
          categories are from the research of Dr. Patrick Kandrac. The frequency
          classifications aims to reflect how often each reading appears in
          common vocabulary.
          <ExternalTextLink text="View full paper." href={kandracPaperUrl} />
        </p>
        <PrimaryDataSources links={readingFrequencySourceLinks} />
      </div>
    </div>
  );
};
