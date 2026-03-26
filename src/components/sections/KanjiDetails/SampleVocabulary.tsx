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
import { SpeakButton } from "@/components/common/SpeakButton";

type CommonWordEntry = [string, string];

const WordRow = ({ entry }: { entry: CommonWordEntry }) => {
  const [word, reading] = entry;
  return (
    <TableRow>
      <TableCell className="w-24">
        <SpeakButton iconType="headphones" word={word} />
      </TableCell>

      <TableCell className="text-base kanji-font w-fit">
        <ExampleWordPopover word={word} />
      </TableCell>
      <TableCell className="text-base kanji-font w-fit">
        {reading !== "-" ? <RomajiBadge kana={reading} /> : "-"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground w-fit">N/A</TableCell>
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
  console.log("data", data)

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

  // TODO: Add pagination; put it in its own <Pagination /> component 
  // default to itemsPerPage=10 at a time.
  // Very simple, something like this:  <--- 1 / 4 ---> 
  // which is PREVIOUS_PAGE_BUTTON_ICON PAGE_1 OUT OF 4_TOTAL_PAGES NEXT_PAGE_BUTTON_ICON

  return (
    <div
      className="px-2 mt-4 -mx-2 overflow-x-auto"
    >
      <Table className="w-full min-w-[400px]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-fit">Speak</TableHead>
            <TableHead className="text-center w-fit">Sample Word</TableHead>
            <TableHead className="text-center w-fit">Reading</TableHead>
            <TableHead className="text-center w-fit">Tags</TableHead>
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
