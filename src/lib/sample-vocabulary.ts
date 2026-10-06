import { JLTPTtypes } from "@/lib/jlpt";

// {w: '上', r: 'うえ, かみ', t: '🌱', e: '1. above 2. ...', j: 5, k: true, o: 'core1,genki'}
// word, readings (comma-separated), frequencyTier, translation, jlpt, kaishi,
// word-list tags (comma-separated, see BOOK_TAGS)
export type CommonWordEntry = {
  w: string;
  r?: string;
  t?: string;
  e?: string;
  k?: number | boolean;
  j?: number;
  o?: string;
  uncommon_form?: boolean;
  uncommon_spelling?: boolean;
  uk?: boolean;
  alt_of?: string;
};

/** Splits a comma-separated data string ("うえ, かみ") into trimmed parts. */
export const splitList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== "-");

// Word-list tags in display priority order (first = shown first).
// Tags in the same `series` are levels of one list; lower `level` = more basic.
export const BOOK_TAGS: {
  id: string;
  label: string;
  jlpt?: JLTPTtypes;
  series?: string;
  level?: number;
}[] = [
  { id: "genki", label: "📔 Genki" },
  { id: "minna1", label: "📕 Minna 1", series: "minna", level: 1 },
  { id: "minna2", label: "📗 Minna 2", series: "minna", level: 2 },
  { id: "quartet", label: "📘 Quartet" },
  { id: "tobira", label: "📒 Tobira" },
  { id: "shin1", label: "Shin N1", jlpt: "n1", series: "shin", level: 4 },
  { id: "klvl1", label: "🌕 K Lvl 1", series: "klvl", level: 1 },
  { id: "shin2", label: "Shin N2", jlpt: "n2", series: "shin", level: 3 },
  { id: "klvl2", label: "🌔 K Lvl 2", series: "klvl", level: 2 },
  { id: "shin3", label: "Shin N3", jlpt: "n3", series: "shin", level: 2 },
  { id: "klvl3", label: "🌓 K Lvl 3", series: "klvl", level: 3 },
  { id: "shin4", label: "Shin N4", jlpt: "n4", series: "shin", level: 1 },
  { id: "klvl4", label: "🌒 K Lvl 4", series: "klvl", level: 4 },
  { id: "klvl5", label: "🌑 K Lvl 5", series: "klvl", level: 5 },
  { id: "core1", label: "🥚 Core 1", series: "core", level: 1 },
  { id: "core2", label: "🐣 Core 2", series: "core", level: 2 },
  { id: "core3", label: "🐥 Core 3", series: "core", level: 3 },
];

/**
 * Known word-list tags of an entry, sorted by BOOK_TAGS priority; unknown tags
 * are dropped, and only the most basic level of each series is kept.
 */
export const getBookTags = (entry: CommonWordEntry) => {
  const ids = new Set(splitList(entry.o));
  const tags = BOOK_TAGS.filter((tag) => ids.has(tag.id));
  return tags.filter(
    (tag) =>
      tag.series == null ||
      !tags.some(
        (other) =>
          other.series === tag.series && (other.level ?? 0) < (tag.level ?? 0)
      )
  );
};

export const FreqCategoryMap: Record<string, string> = {
  "🌱": "basic",
  "☘️": "common",
  "🌷": "fluent",
  //   "📚": "advanced",
  //   "🦉": "unranked",
  //   "🌶️": "niche"
};

// Kaishi 1.5k: explicitly curated beginner vocab — strong signal
const KAISHI_SCORE = 500;

// JLPT level: N5 (easiest) → N1 (hardest); no JLPT = 0
const JLPT_SCORE: Record<number, number> = {
  5: 250,
  4: 200,
  3: 100,
  2: 40,
  1: 20,
};

// Frequency tier: basic > common > fluent > advanced/uncommon
const FREQ_SCORE: Record<string, number> = {
  "🌱": 250,
  "☘️": 200,
  "🌷": 100,
  "📚": 10,
  "🌶️": 0,
  "🦉": 0,
};

export const scoreWordEntry = (entry: CommonWordEntry) => {
  let s = 0;
  if (entry.k != null && entry.k) s += KAISHI_SCORE;
  s += JLPT_SCORE[entry.j ?? -1] ?? 0;
  s += FREQ_SCORE[entry.t ?? "🦉"] ?? 0;
  return s;
};

/** Beginner-friendliest words first (Kaishi, then easy JLPT, then frequency). */
export const sortWordData = (data: CommonWordEntry[]) =>
  [...data].sort((a, b) => scoreWordEntry(b) - scoreWordEntry(a));

// The textbook JSON stores each word as a tuple; jlpt and tags are optional
// trailing members (tags is a comma-separated list like "kaishi, alt, genki").
export type TextbookWordTuple = [
  reading: string,
  translation: string,
  jlpt?: string | number,
  tags?: string,
];
export type TextbookWordEntry = Record<string, TextbookWordTuple>;

export const toCommonWordEntries = (
  words: TextbookWordEntry
): CommonWordEntry[] =>
  Object.entries(words).map(([word, [reading, translation, jlpt, tags]]) => {
    const tagsArray = splitList(tags);
    const bookTags = tagsArray.filter((tag) =>
      BOOK_TAGS.some((bookTag) => bookTag.id === tag)
    );
    return {
      w: word,
      r: reading,
      e: translation,
      j: Number(jlpt),
      k: tagsArray.includes("kaishi"),
      o: bookTags.length > 0 ? bookTags.join(",") : undefined,
      uncommon_form: tagsArray.includes("alt") || tagsArray.includes("uk"),
    };
  });
