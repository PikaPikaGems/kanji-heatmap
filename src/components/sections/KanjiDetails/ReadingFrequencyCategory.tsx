import { useKanjiReadingDetails } from "@/providers/kanji-reading-category-hooks";
import { DefaultErrorFallback } from "@/components/error";
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
import { TableSkeleton } from "./TableSkeleton";
    <span className={`text-xs font-bold ${colorClass}`}>
      <TableCell className="text-base kanji-font">
        <RomajiBadge kana={entry.reading} />
      </TableCell>
        {entry.example_word ? (
          <ExampleWordPopover word={entry.example_word} />
        ) : (
          "-"
        )}
      <TableCell>
    return <TableSkeleton />;
      <div className="w-full p-4 text-base text-center">{`There is no reading usefulness data for ${kanji} right now.`}</div>
    );
    <div className="animate-fade-in" key={kanji}>
      <div className="px-2 mt-4 -mx-2 overflow-x-auto text-left">
        <Table className="w-full min-w-[600px]">
              <TableHead className="text-left">Reading</TableHead>
              <TableHead className="text-left">Frequency</TableHead>
              <TableHead className="text-left">Sample Word</TableHead>
              <TableHead className="text-left">Type </TableHead>
            {kanjiReadingData.map((entry) => (
              <ReadingRow
                key={`${entry.reading}-${entry.example_word}-${entry.frequency}-${entry.type}`}
                entry={entry}
              />
        <p className="my-4">
          This data comes from Dr. Patrick {`Kandrac's`} research on reading
          frequency in common vocabulary.
          <ExternalTextLink text="View full paper." href={kandracPaperUrl} />
        </p>
        <PrimaryDataSources links={readingFrequencySourceLinks} />
