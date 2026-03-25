import { useJsonFetch } from "@/hooks/use-json";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { DefaultErrorFallback } from "@/components/error";
import { Loader2 } from "lucide-react";
import assetsPaths from "@/lib/assets-paths";

type CommonWordEntry = [string, string];

const WordRow = ({ entry }: { entry: CommonWordEntry }) => {
  const [word, reading] = entry;
  return (
    <TableRow>
      <TableCell className="text-base kanji-font">
        <ExampleWordPopover word={word} />
      </TableCell>
      <TableCell className="text-base kanji-font">
        {reading !== "-" ? <RomajiBadge kana={reading} /> : "-"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">N/A</TableCell>
    </TableRow>
  );
};

const PATH = import.meta.env.MODE === "development" ||
  window.location.protocol === "http:"
  ? assetsPaths.dev.KANJI_VOCAB
  : assetsPaths.KANJI_VOCAB

export const SampleVocabulary = ({ kanji }: { kanji: string }) => {
  const url = `${PATH}/${kanji}.json`;
  const { data, status, error } = useJsonFetch<CommonWordEntry[]>(url);

  if (status === "pending" || status === "idle") {
    return (
      <div className="flex items-center justify-center w-full h-full p-5">
        <Loader2 className="size-7 animate-spin" />
      </div>
    );
  }

  if (status === "error" || error) {
    return (
      <DefaultErrorFallback message="Cannot fetch data at this time. Try again later." />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-4 text-sm text-left text-muted-foreground">
        {"We don't have sample words for this kanji yet."}
      </div>
    );
  }

  return (
    <div
      className="px-2 mt-4 -mx-2 overflow-x-auto"
    >
      <Table className="w-full min-w-[400px]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Sample Word</TableHead>
            <TableHead className="text-center">Reading</TableHead>
            <TableHead className="text-center">Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => (
            <WordRow key={`${entry[0]}-${entry[1]}`} entry={entry} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
