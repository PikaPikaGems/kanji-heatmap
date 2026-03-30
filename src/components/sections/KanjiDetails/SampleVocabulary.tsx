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
import assetsPaths from "@/lib/assets-paths";
import { SpeakButton } from "@/components/common/SpeakButton";
import { Pagination, usePagination } from "./Pagination";
import { useEffect, useMemo, useState } from "react";
import { JLPTBadge } from "@/components/common/jlpt/JLPTBadge";
import { JLTPTtypes } from "@/lib/jlpt";
import { BadgeWithPopover } from "@/components/common/BadgeWithPopover";
import { Badge } from "@/components/ui/badge";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";

// {w: '犬小屋', r: 'いぬごや', t: '🦉', e: 'doghouse', j: 5, k: 1}
// word, reading, frequencyTier, translation, jlpt, kaishi 
type CommonWordEntry = { w: string, r?: string, t: string, e?: string, k?: number, j?: number };

const FreqCategoryMap: Record<string, string> = {
  "🌱": "basic",
  "☘️": "common",
  "🌷": "fluent",
  "📚": "advanced",
  "🦉": "uncommon"
}

const WordRow = ({ entry }: { entry: CommonWordEntry }) => {

  const jlptNum = entry.j ? Number(entry.j) : -1
  const jlpt = [1, 2, 3, 4, 5].includes(jlptNum) ? `n${jlptNum}` as JLTPTtypes : null

  return (
    <>
      <TableRow>
        <TableCell className="w-12">
          <SpeakButton iconType="headphones" word={entry.w} />
        </TableCell>
        <TableCell className="text-base kanji-font w-fit">
          <ExampleWordPopover word={entry.w} />
        </TableCell>
        <TableCell className="text-base kanji-font w-fit whitespace-nowrap">
          {entry.r && entry.r !== "-" ? <RomajiBadge kana={entry.r} /> : "-"}
        </TableCell>
        <TableCell className="w-fit max-w-24">
          {entry.e && entry.e !== "-" ? <span className="text-xs font-bold" >{entry.e}</span> : "-"}
        </TableCell>
        <TableCell className="gap-2 px-4 text-sm text-muted-foreground max-w-36">
          {jlpt && <><JLPTBadge jlpt={jlpt} /><br /></>}
          {entry.k && entry.k === 1 &&
            (<BadgeWithPopover name="✓ Kaishi 1.5k" desc={"This word is included in Kaishi 1.5k - a free, modern, modular Japanese Anki deck for beginners "} />)
          }
          {entry.t && entry.t !== "📚" && entry.t !== "🦉" && <Badge className="px-2 m-1 whitespace-nowrap" variant="outline">{entry.t} {FreqCategoryMap[entry.t ?? "🦉"]}</Badge>}
          {(jlpt || (entry.k && entry.k === 1) || entry.t && entry.t !== "📚" && entry.t !== "🦉") ? "" : "-"}
        </TableCell>
      </TableRow>
    </>

  );
};

const sortWordData = (data: CommonWordEntry[]) => {
  const score = (entry: CommonWordEntry) => {
    let s = 0;

    // Kaishi 1.5k: explicitly curated beginner vocab — strong signal
    if (entry.k != null && entry.k >= 1) s += 500;

    // English translation: primary usability signal for learners
    if (entry.e && entry.e !== "-") s += 300;

    // JLPT level: N5 (easiest) → N1 (hardest); no JLPT = 0
    const jlptScore: Record<number, number> = { 5: 200, 4: 160, 3: 80, 2: 40, 1: 20 };
    s += jlptScore[entry.j ?? -1] ?? 0;

    // Frequency tier: basic > common > fluent > advanced/uncommon
    const freqScore: Record<string, number> = { "🌱": 60, "☘️": 50, "🌷": 30, "📚": 10, "🦉": 0 };
    s += freqScore[entry.t] ?? 0;

    return s;
  };

  return [...data].sort((a, b) => score(b) - score(a));
}


const PaginatedVocabulary = ({ data }: { data: CommonWordEntry[] }) => {
  const sortedData = useMemo(() => {
    return sortWordData(data)
  }, [data])

  const { start, end, onPrev, onNext, page, totalPages } = usePagination(sortedData.length);
  const pageData = useMemo(() => {
    const result = sortedData.slice(start, end);
    return result
  }, [sortedData, end, start]);

  const pagination = (
    <>
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}
    </>
  );

  return (
    <div className="px-2 mt-4 -mx-2 overflow-x-auto animate-fade-in" key={`${start}-${end}`}>
      {pagination}
      <Table className="w-full min-w-[400px] mt-4">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left w-fit">Speak</TableHead>
            <TableHead className="text-center w-fit">Word</TableHead>
            <TableHead className="text-center w-fit">Reading</TableHead>
            <TableHead className="text-center max-w-12">Translation</TableHead>
            <TableHead className="text-center w-fit">Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageData.map((entry) => (
            <WordRow key={entry.w} entry={entry} />
          ))}
        </TableBody>
      </Table>
      {pagination}
    </div>
  );
};

const TableSkeleton = () => {
  const [show, setShow] = useState(false)
  useEffect(() => {
    setTimeout(() => setShow(true), 200)
  }, [])


  if (!show) {
    return <div className="h-[800px]"></div>
  }

  return (
    <div className="px-2 mx-2 overflow-x-auto mt-14 animate pulse">
      <Table className="w-full min-w-[400px]" >
        <TableHeader>
          <TableRow>
            <TableHead className="text-left w-fit">Speak</TableHead>
            <TableHead className="text-center w-fit">Word</TableHead>
            <TableHead className="text-center w-fit">Reading</TableHead>
            <TableHead className="w-12 text-center">Translation</TableHead>
            <TableHead className="text-center w-fit">Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="w-12">
                <div className="w-8 h-8 rounded-xl bg-muted" />
              </TableCell>
              <TableCell className="w-fit">
                <div className="w-24 h-12 rounded-full bg-muted" />
              </TableCell>
              <TableCell className="text-left">
                <div className="h-5 rounded-full bg-muted w-36" />
              </TableCell>
              <TableCell className="w-fit">
                <div className="w-24 h-12 rounded-full bg-muted" />
              </TableCell>
              <TableCell className="w-full">
                <div className="w-full h-5 rounded-full bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
const PATH = import.meta.env.MODE === "development" ||
  window.location.protocol === "http:"
  ? assetsPaths.dev.KANJI_VOCAB
  : assetsPaths.KANJI_VOCAB

export const SampleVocabulary = ({ kanji }: { kanji: string }) => {
  const url = `${PATH}/${kanji}.json`;
  const { data, status, error } = useJsonFetch<CommonWordEntry[]>(url);

  if (status === "pending" || status === "idle") {
    return (
      <TableSkeleton />
    );
  }

  if (status === "error" || error) {
    return (
      <DefaultErrorFallback message="Cannot fetch data at this time. Try again later." />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-4 text-sm text-left text-muted-foreground ">
        {"There are no sample words for this kanji yet."}
      </div>
    );
  }

  return (
    <div>
      <PaginatedVocabulary data={data} />
      <div className="mx-4 mt-3 text-[10px] uppercase font-bold text-left">See also:</div>
      <ul className="mx-6 mb-6 italic text-left list-disc">
        <li className="ml-6">🔗 <ExternalTextLink href={"https://pikapikagems.github.io/japanese-word-ranks/"} text="PikaPikaGems' Japanese Word Rank Lookup Website" /></li>
        <li className="ml-6">🐙 <ExternalTextLink href={"https://github.com/PikaPikaGems/japanese-word-frequency"} text="PikaPikaGems' Japanese Word Frequency Compilation" /></li>


      </ul>
    </div>

  );
};
