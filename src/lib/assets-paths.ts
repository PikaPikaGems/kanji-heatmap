const assetsPaths = {
  MAIN_KANJI_INFO_FILE_PATH: "/json/kanji_main.json",
  EXTENDED_KANJI_INFO_FILE_PATH: "/json/kanji_extended.json",
  PHONETIC_FILE: "/json/phonetic.json",
  PART_KEYWORD_FILE: "/json/component_keyword.json",
  VOCAB_MEANING: "/json/vocab_meaning.json",
  VOCAB_FURIGANA: "/json/vocab_furigana.json",
  CUM_USE: "/json/cum_use.json",
  KANJI_SVGS: "https://assets.pikapikagems.com/kanji/",
  KANJI_VOCAB: "https://assets.pikapikagems.com/kanji-common-words/v3c", // Note: No slash at the end is intentional
  TEXT_BOOK_VOCAB: "https://assets.pikapikagems.com/kanji-textbook-words/v3", // Note: No slash at the end is intentional
  dev: {
    KANJI_SVGS: "https://kanjivg.tagaini.net/kanjivg/kanji/",
    KANJI_VOCAB: "/kanji-words/v3c", // Note: No slash at the end is intentional
    TEXT_BOOK_VOCAB: "/kanji-textbook-words-min", // Note: No slash at the end is intentional
  },
  KANJI_REPRESENTATIVE_WORDS: "/json/kanji_representative_words.json",
  KANJI_DECOMPOSITION: "/json/kanji_decomposition.json",
  KANJI_READING_DETAILS: "/json/kanji-readings-details.json",
  KANJI_STRUCTURE_DETAILS: "/json/kanji-structure-hlorenzi.json",
  KANJI_STRUCTURE_KANJIUM: "/json/kanji-structure-kanjium.json",
  KANJI_STRUCTURE_SCOTT: "/json/kanji-structure-scott.json",
  KANJI_STRUCTURE_YAGAYS: "/json/kanji-structure-yagays.json",
  ICON_SVG: "/img/app-icon.svg",
  SPEED_KATAKANA_CHALLENGE_SET: "/json/katakana/challenge-set-", // append `<setNumber>.json`
  SPEED_KATAKANA_CORRECT_SOUND: "/sounds/correct.mp3",
};

export const SPEED_KATAKANA_TOTAL_SETS = 200;
export const SPEED_KATAKANA_FONT_COUNT = 15;

export const SAMPLE_VOCAB_PATH =
  import.meta.env.MODE === "development" || window.location.protocol === "http:"
    ? assetsPaths.dev.KANJI_VOCAB
    : assetsPaths.KANJI_VOCAB;

export const TEXT_BOOK_VOCAB_PATH =
  import.meta.env.MODE === "development" || window.location.protocol === "http:"
    ? assetsPaths.dev.TEXT_BOOK_VOCAB
    : assetsPaths.TEXT_BOOK_VOCAB;

export default assetsPaths;
