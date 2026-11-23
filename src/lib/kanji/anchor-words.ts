import type { CommonWordEntry } from "@/lib/sample-vocabulary";

/**
 * Anchor words. Each kanji has a main word and maybe a secondary word
 * (kanji_words.json); each word's readings, gloss, tags and ranks are stored
 * once per word (word_readings.json, word_meanings.json, word_tags.json,
 * word_ranks.json).
 */

/** Per kanji: main anchor, secondary anchor, then two sample words as furigana; "" when missing. */
export type KanjiWordsFile = Record<
  string,
  [
    mainAnchor: string,
    secondaryAnchor: string,
    sample1Furigana: string,
    sample2Furigana: string,
  ]
>;

/** Per word: ","-joined tags and the tier emoji (anchor and sample words). */
export type WordTagsFile = Record<string, [tags: string, tierEmoji: string]>;

/** Per anchor word: 17 frequency ranks (-1 = not ranked). */
export type WordRanksFile = Record<string, number[]>;

/** What tiles, filters and mastery read: a kanji's main word, its readings and its secondary word. */
export type AnchorIndexEntry = {
  word: string;
  /** "・"-joined, as tiles show it. */
  reading: string;
  /** "" when the kanji has none. */
  secondary: string;
};

/** Kanji with a main anchor word only. */
export type AnchorIndex = Record<string, AnchorIndexEntry>;

/** What the games need: the word, its readings (the kanji's own first) and a short English gloss. */
export type AnchorWordBasics = {
  word: string;
  readings: string[];
  englishGloss: string;
};

/** Everything the detail surfaces show about an anchor word. */
export type AnchorWord = AnchorWordBasics & {
  /** Word-list tags, e.g. n4, handpicked, reviewed, kaishi, genki, klvl2, name. */
  tags: string[];
  /** 17 frequency ranks in ANCHOR_RANK_SOURCES order; -1 = not ranked. */
  ranks: number[];
  /** Frequency tier emoji, e.g. 🌱; "" while unknown. */
  tier: string;
};

export type KanjiAnchorWords<T extends AnchorWordBasics = AnchorWord> = {
  main: T;
  secondary: T | null;
};

/** One anchor word from its "・"-joined readings and its gloss ("" when none). */
export const toAnchorWordBasics = (
  word: string,
  readings: string | undefined,
  gloss: string | undefined
): AnchorWordBasics => ({
  word,
  readings: (readings ?? "").split("・").filter((reading) => reading !== ""),
  englishGloss: gloss ?? "",
});

const JLPT_TAGS = ["n5", "n4", "n3", "n2", "n1"];

/**
 * A word's tags (and tier, when given) as a word-list entry, so they show like
 * other words' badges.
 */
export const toTagsWordEntry = (
  word: string,
  tags: string[],
  tier?: string
): CommonWordEntry => {
  const jlpt = tags.find((tag) => JLPT_TAGS.includes(tag));
  return {
    w: word,
    t: tier,
    j: jlpt ? Number(jlpt.slice(1)) : undefined,
    k: tags.includes("kaishi"),
    o: tags.join(","),
  };
};

/** Adds a word's tags and tier (word_tags.json) and ranks (word_ranks.json). */
export const withFrequencyTags = (
  basics: AnchorWordBasics,
  tags: WordTagsFile[string] | undefined,
  ranks: number[] | undefined
): AnchorWord => {
  const [joined = "", tier = ""] = tags ?? [];
  return {
    ...basics,
    tags: joined.split(",").filter((tag) => tag !== ""),
    ranks: ranks ?? [],
    tier,
  };
};

/**
 * The anchor word a review-pile item was added with, if it is still one of
 * the kanji's anchor words. Null when the data has moved on.
 */
export const findAnchorWord = <T extends AnchorWordBasics>(
  words: KanjiAnchorWords<T> | null,
  word: string
): T | null => {
  if (words == null) return null;
  if (words.main.word === word) return words.main;
  if (words.secondary?.word === word) return words.secondary;
  return null;
};

/** The tier emoji's name, as on the kanji-common-words pages. */
export const ANCHOR_TIER_LABELS: Record<string, string> = {
  "🌱": "Basic",
  "☘️": "Common",
  "🌷": "Fluent",
  "📚": "Advanced",
  "🌶️": "Niche",
  "🦉": "Unranked",
};

/** One of the frequency lists an anchor word is ranked in. */
export type AnchorRankSource = {
  label: string;
  /** What the list counts, in one sentence. */
  description: string;
  /** How big the list (or the text it was counted from) is. */
  size: string;
  /** Where the text comes from, and when, if known. */
  coverage?: string;
  /** The list's home page. */
  url: string;
  /** Ranks past this aren't kept (too few sightings to trust). */
  cap: number;
};

/** Most lists keep their top 20,000 words. */
const LIST_CAP = 20_000;

/**
 * The 17 frequency lists behind `AnchorWord.ranks`, in order (jp-misc-data
 * `jp-word-ranks-data/BUILD/sources.py`). The facts are from each list's
 * README there (`RAW/`) and `docs/SOURCES.md`.
 */
const SOURCES: (Omit<AnchorRankSource, "cap"> & { cap?: number })[] = [
  {
    label: "Conversations",
    description:
      "Everyday spoken Japanese: the Corpus of Everyday Japanese Conversation (CEJC) by NINJAL, all conversation types (small talk, consultations, meetings, classes…).",
    size: "About 2.4 million words of speech, counted in short words.",
    coverage: "Recordings of real, everyday conversations.",
    url: "https://clrd.ninjal.ac.jp/cejc/",
    cap: 11_000,
  },
  {
    label: "Small talk",
    description:
      "The casual small talk (雑談) part of NINJAL's CEJC conversation corpus.",
    size: "About 1.7 million words of speech, counted in short words.",
    coverage: "Recordings of real, everyday conversations.",
    url: "https://clrd.ninjal.ac.jp/cejc/",
    cap: 9_000,
  },
  {
    label: "Written (compounds)",
    description:
      "Written Japanese: NINJAL's Balanced Corpus of Contemporary Written Japanese (BCCWJ), counting compounds and verb endings as one word (食べました is one word).",
    size: "104.3 million words of text.",
    coverage:
      "Books, magazines, newspapers, textbooks, blogs, forums, laws and Diet minutes, mostly from 1986 to 2006.",
    url: "https://clrd.ninjal.ac.jp/bccwj/en/freq-list.html",
  },
  {
    label: "Written (short words)",
    description:
      "The same BCCWJ corpus, split into the smallest units (食べる and ます count separately).",
    size: "104.3 million words of text.",
    coverage:
      "Books, magazines, newspapers, textbooks, blogs, forums, laws and Diet minutes, mostly from 1986 to 2006.",
    url: "https://clrd.ninjal.ac.jp/bccwj/en/freq-list.html",
  },
  {
    label: "Web (CC100)",
    description:
      "Web text from CC-100, a cleaned-up slice of CommonCrawl. Formal, written words rank higher here than in fiction.",
    size: "About 70 GB of Japanese text; about 160,000 different words.",
    coverage: "Web pages, released around 2020.",
    url: "https://github.com/MarvNC/yomitan-dictionaries#cc100",
  },
  {
    label: "Web (NWJC)",
    description:
      "The NINJAL Web Japanese Corpus (NWJC), a large corpus of written Japanese from the web.",
    size: "About 106,800 ranked words.",
    url: "https://masayu-a.github.io/NWJC/",
  },
  {
    label: "Wikipedia",
    description: "Japanese Wikipedia, by Thermospore (version 2).",
    size: "About 850,000 different words.",
    url: "https://github.com/MarvNC/yomitan-dictionaries",
  },
  {
    label: "Slice-of-life anime",
    description:
      "Subtitles of slice-of-life anime, from Dave Doebrick's frequency list compilation.",
    size: "About 4.1 million words of subtitles; about 44,900 ranked words.",
    url: "https://docs.google.com/document/d/1IUWkvBxhoazBSTyRbdyRVk7hfKE51yorE86DCRNQVuw/",
  },
  {
    label: "Media (jiten)",
    description:
      "jiten.moe's list for all media combined: anime, drama, manga, movies, novels, video games, visual novels, web novels and more.",
    size: "About 462,600 ranked words.",
    coverage: "Downloaded on 2026-11-09 (jiten.moe keeps updating it).",
    url: "https://jiten.moe/other",
  },
  {
    label: "TV drama (jiten)",
    description: "jiten.moe's list for live-action Japanese TV drama.",
    size: "About 223,100 ranked words.",
    coverage: "Downloaded on 2026-11-09 (jiten.moe keeps updating it).",
    url: "https://jiten.moe/other",
  },
  {
    label: "Anime + drama",
    description:
      "Anime and J-drama subtitles, from Shoui's frequency dictionaries.",
    size: "About 100,000 different words.",
    url: "https://anacreondjt.gitlab.io/docs/freq/",
  },
  {
    label: "YouTube",
    description:
      "Hand-transcribed YouTube videos covering 16 kinds of spoken Japanese (version 3). Built from less text than most lists, so read its ranks as a rough guide.",
    size: "About 40,000 videos; about 187,000 different words.",
    url: "https://github.com/MarvNC/yomitan-dictionaries#youtube-frequency-dictionaries",
  },
  {
    label: "Netflix (Shoui)",
    description:
      "Netflix Japan subtitles, from Shoui's frequency dictionaries.",
    size: "About 129,000 different words.",
    url: "https://anacreondjt.gitlab.io/docs/freq/",
  },
  {
    label: "Netflix (Dave Doebrick)",
    description:
      "Netflix Japan subtitles (around 2019), with names removed, from Dave Doebrick's word frequency report.",
    size: "About 105,300 ranked words.",
    url: "https://docs.google.com/document/d/1IUWkvBxhoazBSTyRbdyRVk7hfKE51yorE86DCRNQVuw/",
  },
  {
    label: "Anime (animefreq)",
    description:
      "Anime subtitles from Kitsunekko, analyzed by mrpudn's animefreq (TV dramas and other non-anime titles left out).",
    size: "About 48 million words of subtitles; about 204,300 different words.",
    coverage: "Subtitles exported in April 2020.",
    url: "https://github.com/mrpudn/animefreq",
  },
  {
    label: "YouTube (jiten)",
    description: "jiten.moe's list for YouTube video subtitles.",
    size: "About 106,800 ranked words.",
    coverage: "Downloaded on 2026-11-09 (jiten.moe keeps updating it).",
    url: "https://jiten.moe/other",
  },
  {
    label: "JPDB.io",
    description:
      "The word's place in jpdb.io's 22k frequency deck, a study deck ordered by jpdb's large corpus (it leaves out grammar words like する and だ).",
    size: "22,316 words.",
    url: "https://jpdb.io",
  },
];

export const ANCHOR_RANK_SOURCES: AnchorRankSource[] = SOURCES.map(
  (source) => ({ cap: LIST_CAP, ...source })
);

/**
 * One scale for every list (a rank means the same in each): ranks beyond this
 * fill none of the bar.
 */
export const ANCHOR_RANK_BAR_MAX = 16_000;

/**
 * The word is past a list that stops before the bar's end (CEJC, small talk):
 * it may still be fairly common, so it isn't shown as an empty bar.
 */
export const isPastShortList = (source: AnchorRankSource, rank: number) =>
  rank === -1 && source.cap < ANCHOR_RANK_BAR_MAX;

/** How full a rank's bar is, 0–100; an unranked word (-1) has an empty bar. */
export const anchorRankProgress = (rank: number) =>
  rank === -1
    ? 0
    : (Math.max(ANCHOR_RANK_BAR_MAX - rank, 0) * 100) / ANCHOR_RANK_BAR_MAX;
