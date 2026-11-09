/**
 * Anchor words (data handoff: jp-misc-data
 * kanji-heatmap-build-2/docs/ANCHOR_WORDS_APP_HANDOFF.md). Each kanji has a
 * main word (in kanji_main.json) and maybe a secondary word (in
 * anchor_words_details.json).
 */

/** Per kanji: the main word's gloss, then the secondary word, its ","-joined readings and gloss ("" when none). */
export type AnchorWordsDetailsFile = Record<
  string,
  [
    mainGloss: string,
    secondaryWord: string,
    secondaryReadings: string,
    secondaryGloss: string,
  ]
>;

/** Per word (main and secondary): ","-joined tags, 15 frequency ranks (-1 = not ranked) and the tier emoji. */
export type AnchorWordsFrequencyTagsFile = Record<
  string,
  [tags: string, ranks: number[], tierEmoji: string]
>;

/** What the games need: the word, its readings (the kanji's own first) and a short English gloss. */
export type AnchorWordBasics = {
  word: string;
  readings: string[];
  englishGloss: string;
};

/** Everything the detail surfaces show about an anchor word. */
export type AnchorWord = AnchorWordBasics & {
  /** Word-list tags, e.g. n4, kaishi, genki, klvl2, name. */
  tags: string[];
  /** 15 frequency ranks in ANCHOR_RANK_SOURCES order; -1 = not ranked. */
  ranks: number[];
  /** Frequency tier emoji, e.g. 🌱; "" while unknown. */
  tier: string;
};

export type KanjiAnchorWords<T extends AnchorWordBasics = AnchorWord> = {
  main: T;
  secondary: T | null;
};

const splitReadings = (joined: string | null | undefined, separator: string) =>
  (joined ?? "").split(separator).filter((reading) => reading !== "");

/**
 * A kanji's anchor words from its main-info word and reading
 * (kanji_main.json, readings "・"-joined) and its details entry (secondary
 * readings ","-joined). Null when the kanji has no main word. Without the
 * details entry the main word has no gloss and there is no secondary word.
 */
export const toAnchorWordBasics = (
  repWord: string | null | undefined,
  repReading: string | null | undefined,
  details: AnchorWordsDetailsFile[string] | undefined
): KanjiAnchorWords<AnchorWordBasics> | null => {
  if (!repWord) return null;
  const [mainGloss = "", secondaryWord = "", secondaryReadings = ""] =
    details ?? [];
  const secondaryGloss = details?.[3] ?? "";
  return {
    main: {
      word: repWord,
      readings: splitReadings(repReading, "・"),
      englishGloss: mainGloss,
    },
    secondary: secondaryWord
      ? {
          word: secondaryWord,
          readings: splitReadings(secondaryReadings, ","),
          englishGloss: secondaryGloss,
        }
      : null,
  };
};

/** Adds a word's tags, ranks and tier from the frequency-tags file. */
export const withFrequencyTags = (
  basics: AnchorWordBasics,
  entry: AnchorWordsFrequencyTagsFile[string] | undefined
): AnchorWord => {
  const [tags = "", ranks = [], tier = ""] = entry ?? [];
  return {
    ...basics,
    tags: tags.split(",").filter((tag) => tag !== ""),
    ranks,
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
};

/**
 * The 15 frequency lists behind `AnchorWord.ranks`, in order. The facts are
 * from each list's README in jp-misc-data (`jp-word-ranks-data/RAW/`).
 */
export const ANCHOR_RANK_SOURCES: AnchorRankSource[] = [
  {
    label: "Conversations",
    description:
      "Everyday spoken Japanese: the Corpus of Everyday Japanese Conversation (CEJC) by NINJAL, all conversation types (small talk, consultations, meetings, classes…).",
    size: "About 29,500 entries (28,000 different words), counted in short words.",
    coverage: "Recordings of real, everyday conversations.",
    url: "https://clrd.ninjal.ac.jp/cejc/",
  },
  {
    label: "Small talk",
    description:
      "The casual small talk (雑談) part of NINJAL's CEJC conversation corpus.",
    size: "Only words that come up in small talk, counted in short words.",
    coverage: "Recordings of real, everyday conversations.",
    url: "https://clrd.ninjal.ac.jp/cejc/",
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
    size: "About 44,900 ranked words.",
    url: "https://docs.google.com/document/d/1IUWkvBxhoazBSTyRbdyRVk7hfKE51yorE86DCRNQVuw/",
  },
  {
    label: "Media (jiten)",
    description:
      "jiten.moe's list for all media combined: anime, drama, manga, movies, novels, video games, visual novels, web novels and more.",
    size: "About 430,700 ranked words.",
    url: "https://jiten.moe/other",
  },
  {
    label: "TV drama (jiten)",
    description: "jiten.moe's list for live-action Japanese TV drama.",
    size: "About 217,900 ranked words.",
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
    label: "JPDB.io",
    description: "The word's place in jpdb.io's frequency deck.",
    size: "22,316 words, ranked up to 30,000 (the deck skips some ranks).",
    url: "https://jpdb.io",
  },
];

/** Only each list's top words are kept, so a word past this is "not ranked". */
export const ANCHOR_RANK_LIST_CAP = 25_000;

/** Ranks beyond this fill none of the bar. */
export const ANCHOR_RANK_BAR_MAX = 15_000;

/** How full a rank's bar is, 0–100; an unranked word (-1) has an empty bar. */
export const anchorRankProgress = (rank: number) =>
  rank === -1
    ? 0
    : (Math.max(ANCHOR_RANK_BAR_MAX - rank, 0) * 100) / ANCHOR_RANK_BAR_MAX;
