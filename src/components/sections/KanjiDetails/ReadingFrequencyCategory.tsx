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

// Source links for reading frequency data
const readingFrequencySourceLinks = [
  {
    text: "Spreadsheet",
    url: "https://docs.google.com/spreadsheets/d/1MBYfKPrlST3F51KIKbAlsGw1x4c_atuHfPwSSRN5sLs/edit?gid=496425456#gid=496425456",
  },
  {
    text: "Research Paper",
    url: "https://www.researchgate.net/publication/357159664_2242_Kanji_Frequency_List_ver_11",
  },
];

const FrequencyBadge = ({ frequency }: { frequency: FrequencyCategory }) => {
  const label = frequencyLabels[frequency];
  const colorClass = frequencyColors[frequency];

  return (
    <span className={`font-medium text-left  ${colorClass}`}>
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
      <TableCell className="font-medium text-lg ">{entry.reading}</TableCell>
      <TableCell>
        <ReadingTypeBadge type={entry.type} />
      </TableCell>
      <TableCell>
        <ExampleWordPopover word={entry.example_word} />
      </TableCell>
      <TableCell className="text-left">
        <FrequencyBadge frequency={entry.frequency} />
      </TableCell>
    </TableRow>
  );
};

const MethodologyNote = () => (
  <div className="text-sm text-muted-foreground mb-4 text-left">
    <p className="text-left">
      Reading frequency categories are based on how often each reading appears
      in common vocabulary. The associated example word shows a typical usage
      that contributed to the frequency rating.
    </p>
    <ul className="mt-2 space-y-1 list-disc list-inside text-left">
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
    <div className="mt-3 flex items-center gap-1">
      <span className="font-bold">Sources:</span>
      {readingFrequencySourceLinks.map((link, index) => (
        <span key={link.text}>
          <ExternalTextLink href={link.url} text={link.text} />
          {index < readingFrequencySourceLinks.length - 1 && <span> | </span>}
        </span>
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
      <div className="text-muted-foreground text-sm py-4 text-left">
        No reading frequency data available for this kanji.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Reading</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[120px]">Sample</TableHead>
              <TableHead>Frequency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kanjiReadingData.map((entry, index) => (
              <ReadingRow key={`${entry.reading}-${index}`} entry={entry} />
            ))}
          </TableBody>
        </Table>
      </div>
      <MethodologyNote />
    </div>
  );
};
