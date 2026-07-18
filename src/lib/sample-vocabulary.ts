// {w: '犬小屋', r: 'いぬごや', t: '🦉', e: 'doghouse', j: 5, k: 1}
// word, reading, frequencyTier, translation, jlpt, kaishi
export type CommonWordEntry = {
  w: string;
  r?: string;
  t?: string;
  e?: string;
  k?: number | boolean;
  j?: number;
  uncommon_form?: boolean;
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
// trailing members (tags is a comma-separated list like "kaishi,alt").
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
    const tagsArray = (tags ?? "").split(",").map((tag) => tag.trim());
    return {
      w: word,
      r: reading,
      e: translation,
      j: Number(jlpt),
      k: tagsArray.includes("kaishi"),
      uncommon_form: tagsArray.includes("alt"),
    };
  });
