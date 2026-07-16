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
import { SAMPLE_VOCAB_PATH, TEXT_BOOK_VOCAB_PATH } from "@/lib/assets-paths";
import { SpeakButton } from "@/components/common/SpeakButton";
import {
  Pagination,
  usePagination,
  useKeyboardPagination,
  PaginationShortcuts,
} from "./Pagination";
import { useEffect, useMemo, useState } from "react";
import { JLPTBadge } from "@/components/common/jlpt/JLPTBadge";
import { JLTPTtypes } from "@/lib/jlpt";
import { BadgeWithPopover } from "@/components/common/BadgeWithPopover";
import { Badge } from "@/components/ui/badge";
import { PrimaryDataSources } from "@/components/common/PrimaryDataSources";
import { JishoBtn } from "@/components/common/JishoBtn";
import { JotobaBtn } from "@/components/common/JotobaBtn";
import { BugIconErrorBoundary } from "@/components/error";
import { Keyboard } from "@/components/icons";

// {w: '犬小屋', r: 'いぬごや', t: '🦉', e: 'doghouse', j: 5, k: 1}
// word, reading, frequencyTier, translation, jlpt, kaishi
type CommonWordEntry = {
  w: string;
  r?: string;
  t?: string;
  e?: string;
  k?: number | boolean;
  j?: number;
  uncommon_form?: boolean;
};

const FreqCategoryMap: Record<string, string> = {
  "🌱": "basic",
  "☘️": "common",
  "🌷": "fluent",
  //   "📚": "advanced",
  //   "🦉": "unranked",
  //   "🌶️": "niche"
};

const WordTagBadges = ({
  jlpt,
  isKaishi,
  tier,
  isUncommonForm,
  showEmptyState = false,
  breakAfterJlpt = false,
}: {
  jlpt: JLTPTtypes | null;
  isKaishi: boolean;
  tier?: string;
  isUncommonForm?: boolean;
  showEmptyState?: boolean;
  breakAfterJlpt?: boolean;
}) => {
  const freqLabel = tier ? FreqCategoryMap[tier] : undefined;
  const hasAnyTag = jlpt || isKaishi || freqLabel || isUncommonForm;

  return (
    <>
      {jlpt && (
        <>
          {<JLPTBadge jlpt={jlpt} />}
          {breakAfterJlpt && <br />}
        </>
      )}
      {isKaishi && (
        <BadgeWithPopover
          name="✓ Kaishi 1.5k"
          desc="This word is included in Kaishi 1.5k - a free, modern, modular Japanese Anki deck for beginners"
        />
      )}
      {freqLabel && (
        <Badge className="px-2 m-1 whitespace-nowrap" variant="outline">
          {tier} {freqLabel}
        </Badge>
      )}
      {isUncommonForm && (
        <BadgeWithPopover
          name="⚠️ Variant"
          desc="This word might not be usually written or read this way"
        />
      )}
      {showEmptyState && !hasAnyTag && "-"}
    </>
  );
};

const WordRow = ({ entry }: { entry: CommonWordEntry }) => {
  const jlptNum = entry.j ? Number(entry.j) : -1;
  const jlpt = [1, 2, 3, 4, 5].includes(jlptNum)
    ? (`n${jlptNum}` as JLTPTtypes)
    : null;
  const isKaishi = entry.k === true || entry.k === 1;
  const tier = entry.t && FreqCategoryMap[entry.t] ? entry.t : undefined;

  return (
    <>
      <TableRow className="animate-fade-in">
        <TableCell className="w-12">
          <SpeakButton iconType="headphones" word={entry.w} />
        </TableCell>
        <TableCell className="text-base kanji-font w-fit">
          <ExampleWordPopover
            word={entry.w}
            readingOverride={entry.r}
            wordTranslationOverride={entry.e}
            optionalSection={
              <WordTagBadges
                jlpt={jlpt}
                isKaishi={isKaishi}
                tier={tier}
                isUncommonForm={entry.uncommon_form}
              />
            }
          />
        </TableCell>
        <TableCell className="text-base kanji-font w-fit whitespace-nowrap">
          {entry.r && entry.r !== "-" ? (
            <>
              {" "}
              {entry.r.split(",").map((r) => {
                return <RomajiBadge key={r} kana={r} />;
              })}
            </>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="w-fit max-w-24">
          {entry.e && entry.e !== "-" ? (
            <span className="text-xs font-bold">{entry.e}</span>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="gap-2 px-4 text-sm text-muted-foreground max-w-36">
          <WordTagBadges
            jlpt={jlpt}
            isKaishi={isKaishi}
            tier={tier}
            isUncommonForm={entry.uncommon_form}
            showEmptyState
            breakAfterJlpt
          />
        </TableCell>
        <TableCell className="w-12">
          <BugIconErrorBoundary>
            <JishoBtn word={entry.w} />
          </BugIconErrorBoundary>
        </TableCell>
        <TableCell className="w-12">
          <BugIconErrorBoundary>
            <JotobaBtn word={entry.w} />
          </BugIconErrorBoundary>
        </TableCell>
      </TableRow>
    </>
  );
};

const sortWordData = (data: CommonWordEntry[]) => {
  const score = (entry: CommonWordEntry) => {
    let s = 0;

    // Kaishi 1.5k: explicitly curated beginner vocab — strong signal
    if (entry.k != null && entry.k) s += 500;

    // JLPT level: N5 (easiest) → N1 (hardest); no JLPT = 0
    const jlptScore: Record<number, number> = {
      5: 250,
      4: 200,
      3: 100,
      2: 40,
      1: 20,
    };
    s += jlptScore[entry.j ?? -1] ?? 0;

    // Frequency tier: basic > common > fluent > advanced/uncommon
    const freqScore: Record<string, number> = {
      "🌱": 250,
      "☘️": 200,
      "🌷": 100,
      "📚": 10,
      "🌶️": 0,
      "🦉": 0,
    };
    s += freqScore[entry.t ?? "🦉"] ?? 0;

    return s;
  };

  return [...data].sort((a, b) => score(b) - score(a));
};

const ShortcutKey = ({ label }: { label: string }) => (
  <kbd className="inline-flex whitespace-nowrap items-center px-2 py-1 font-mono text-[11px] font-medium lowercase border border-dotted rounded-xl bg-background text-foreground/70">
    {label}
  </kbd>
);

const ShortcutHint = ({ shortcuts }: { shortcuts: PaginationShortcuts }) => (
  <div className="flex justify-center mt-5 mb-1 uppercase">
    <div className="inline-flex overflow-x-auto items-center gap-4 rounded-full  bg-muted/10 px-5 py-2 text-[10px] text-muted-foreground">
      <Keyboard className="w-4 h-4 shrink-0" />
      <span>shortcuts</span>
      <span className="flex items-center gap-2">
        <ShortcutKey label={shortcuts.prev.label} />
        <span>previous</span>
      </span>
      <span className="flex items-center gap-1.5">
        <ShortcutKey label={shortcuts.next.label} />
        <span>next</span>
      </span>
    </div>
  </div>
);

const PaginatedVocabulary = ({
  data,
  shortcuts,
}: {
  data: CommonWordEntry[];
  shortcuts?: PaginationShortcuts;
}) => {
  const sortedData = useMemo(() => {
    return sortWordData(data);
  }, [data]);

  const { start, end, onPrev, onNext, page, totalPages } = usePagination(
    sortedData.length
  );
  const pageData = useMemo(() => {
    const result = sortedData.slice(start, end);
    return result;
  }, [sortedData, end, start]);

  useKeyboardPagination(shortcuts, onPrev, onNext, page, totalPages);

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
    <div className="px-2 mt-4 -mx-2 overflow-x-auto" key={`${start}-${end}`}>
      <p className="w-full px-4 text-left">
        {data.length} total {data.length === 1 ? "item" : "items"}
      </p>
      {pagination}
      <Table className="w-full min-w-[400px] mt-4 animate-fade-in">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left w-fit">Speak</TableHead>
            <TableHead className="text-center w-fit">Word</TableHead>
            <TableHead className="text-center w-fit">Reading</TableHead>
            <TableHead className="text-center min-w-16 max-w-24">
              Translation
            </TableHead>
            <TableHead className="text-center w-fit">Tags</TableHead>
            <TableHead className="w-24 text-left">Jisho.org</TableHead>
            <TableHead className="w-24 text-left">Jotoba.de</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageData.map((entry) => (
            <WordRow key={entry.w} entry={entry} />
          ))}
        </TableBody>
      </Table>
      {pagination}
      {shortcuts && totalPages > 1 && <ShortcutHint shortcuts={shortcuts} />}
    </div>
  );
};

const TableSkeleton = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setTimeout(() => setShow(true), 200);
  }, []);

  if (!show) {
    return <div className="h-[800px]"></div>;
  }

  return (
    <div className="px-2 mx-2 overflow-x-auto mt-14 animate pulse">
      <Table className="w-full min-w-[400px]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left w-fit">Speak</TableHead>
            <TableHead className="text-center w-fit">Word</TableHead>
            <TableHead className="text-center w-fit">Reading</TableHead>
            <TableHead className="w-12 text-center">Translation</TableHead>
            <TableHead className="text-center w-fit min-w-16 max-w-24">
              Tags
            </TableHead>
            <TableHead className="w-24 text-left">Jisho.org</TableHead>
            <TableHead className="w-24 text-left">Jotoba.de</TableHead>
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
              <TableCell className="w-12">
                <div className="w-8 h-8 rounded-xl bg-muted" />
              </TableCell>
              <TableCell className="w-12">
                <div className="w-8 h-8 rounded-xl bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export const SampleVocabulary = ({ kanji }: { kanji: string }) => {
  const url = `${SAMPLE_VOCAB_PATH}/${kanji}.json`;
  const { data, status, error } = useJsonFetch<CommonWordEntry[]>(url);

  if (status === "pending" || status === "idle") {
    return <TableSkeleton />;
  }

  if (status === "error" || error || !data || data.length === 0) {
    return (
      <div className="w-full p-4 text-base text-center">{`There are no entries for ${kanji} right now.`}</div>
    );
  }

  return (
    <div>
      <PaginatedVocabulary
        data={data}
        shortcuts={{
          prev: { key: "a", shiftKey: true, label: "Shift + A" },
          next: { key: "d", shiftKey: true, label: "Shift + D" },
        }}
      />
      <PrimaryDataSources
        links={[
          {
            text: "JP Word Ranks Lookup",
            url: "https://pikapikagems.github.io/japanese-word-ranks/about/",
          },
        ]}
      />
    </div>
  );
};

type Reading = string;
type Translation = string;
type WordString = string;

type TextbookWordEntry = Record<WordString, [Reading, Translation]>;

export const TextbookVocabulary = ({ kanji }: { kanji: string }) => {
  const url = `${TEXT_BOOK_VOCAB_PATH}/${kanji}.json`;
  const { data, status, error } = useJsonFetch<TextbookWordEntry>(url);

  if (status === "pending" || status === "idle") {
    return <TableSkeleton />;
  }

  if (
    status === "error" ||
    error ||
    !data ||
    Object.keys(data?.[kanji] ?? {}).length === 0
  ) {
    return (
      <div className="w-full p-4 text-base text-center">{`There are no entries for ${kanji} right now.`}</div>
    );
  }

  // convert data to CommonWordEntry[]
  const commonWordData = Object.entries(data[kanji]).map(
    ([word, [reading, translation, jlpt, tags]]) => {
      const tagsArray = (tags ?? "").split(",").map((tag) => tag.trim());
      const isKaishi = tagsArray.includes("kaishi");
      const isUncommonForm = tagsArray.includes("alt");
      return {
        w: word,
        r: reading,
        e: translation,
        j: Number(jlpt),
        k: isKaishi,
        uncommon_form: isUncommonForm,
      } as CommonWordEntry;
    }
  );

  return (
    <div>
      <PaginatedVocabulary
        data={commonWordData}
        shortcuts={{
          prev: { key: "a", label: "a" },
          next: { key: "d", label: "d" },
        }}
      />
      <PrimaryDataSources
        links={[
          {
            text: "Anki Deck: 1564742924",
            url: "https://ankiweb.net/shared/info/1564742924",
          },
          {
            text: "Anki Deck: 779483253",
            url: "https://ankiweb.net/shared/info/779483253",
          },
          {
            text: "Anki Deck: 2106223612",
            url: "https://ankiweb.net/shared/info/2106223612",
          },
          {
            text: "Anki Deck: 1468618470",
            url: "https://ankiweb.net/shared/info/1468618470",
          },
          {
            text: "Kanji Mastery Blog",
            url: "https://kanjimastery.blogspot.com/",
          },
        ]}
      />
    </div>
  );
};
