import {
  useKanjiReadingDetails,
  frequencyLabels,
  frequencyColors,
  readingTypeLabels,
  KanjiReadingEntry,
  FrequencyCategory,
} from "@/providers/kanji-reading-category-provider";

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
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { readingFrequencySourceLinks } from "@/lib/freq/freq-source-info";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";

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
        {entry.example_word ? <ExampleWordPopover word={entry.example_word} /> : "-"}
      </TableCell>
      <TableCell>
        <ReadingTypeBadge type={entry.type} />
      </TableCell>
    </TableRow>
  );
};

const MethodologyNote = () => (
  <div className="p-4 text-sm text-left text-muted-foreground">
    <p className="text-left">
      All data and the methodology used to determine the reading frequency categories are from the research of Dr. Patrick Kandrac. The frequency classifications aims to reflect how often each reading appears in common vocabulary. The associated example word illustrates a typical usage that contributed to the assigned frequency rating.
    </p>
    <ul className="mt-2 space-y-1 text-left list-disc list-inside">
      <li>
        <span className={frequencyColors["↑"]}>↑ Often Used</span> - Frequently
        encountered in everyday Japanese
      </li>
      <li>
        <span className={frequencyColors["↔"]}>↔ Sometimes Used</span> -
        Occasionally seen in common contexts
      </li>
      <li>
        <span className={frequencyColors["↓"]}>↓ Almost Never Used</span> -
        Rarely used or found mainly in specialized vocabulary
      </li>
    </ul>
    <div className="pt-4 font-bold">See also:</div>
    <div className="pl-6">
      {readingFrequencySourceLinks.map((link) => (
        <li key={link.text}>
          <ExternalTextLink href={link.url} text={link.text} />
        </li>
      ))}
    </div>
  </div>
);

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
      <div className="py-4 text-sm text-left text-muted-foreground">
        No reading frequency data available for this kanji.
      </div>
    );
  }

  return (
    <div>
      <div
        className="px-2 mt-4 -mx-2 overflow-x-auto"

      >
        <Table className="w-full min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Reading</TableHead>
              <TableHead className="text-center">Frequency</TableHead>
              <TableHead className="text-center">Sample Word</TableHead>
              <TableHead className="text-center">Type </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kanjiReadingData.map((entry) => (
              <ReadingRow key={`${entry.reading}-${entry.example_word}-${entry.frequency}-${entry.type}`} entry={entry} />
            ))}
          </TableBody>
        </Table>
      </div>
      <MethodologyNote />
    </div>
  );
};
