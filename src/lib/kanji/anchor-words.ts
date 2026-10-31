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
