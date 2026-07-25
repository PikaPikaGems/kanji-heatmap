const assetsPaths = {
  MAIN_KANJI_INFO_FILE_PATH: "/json/v2/kanji_main.json",
  EXTENDED_GENERAL_FILE_PATH: "/json/v2/kanji_extended_general.json",
  EXTENDED_HOVER_FILE_PATH: "/json/v2/kanji_extended_hover.json",
  COMPONENTS_FILE: "/json/v2/components.json",
  VOCAB_FILE: "/json/v2/vocab.json",
  REP_WORD_DETAILS_FILE: "/json/v2/rep_word_details.json",
  CUM_USE: "/json/v2/cum_use.json",
  KANJI_SVGS: "https://assets.pikapikagems.com/kanji/",
  KANJI_VOCAB: "https://assets.pikapikagems.com/kanji-common-words/v4", // Note: No slash at the end is intentional
  TEXT_BOOK_VOCAB: "https://assets.pikapikagems.com/kanji-textbook-words/v4", // Note: No slash at the end is intentional
  dev: {
    KANJI_SVGS: "https://kanjivg.tagaini.net/kanjivg/kanji/",
    KANJI_VOCAB: "/kanji-words/v4", // Note: No slash at the end is intentional
    TEXT_BOOK_VOCAB: "/kanji-textbook-words-min", // Note: No slash at the end is intentional
  },
  KANJI_DECOMPOSITION: "/json/v2/kanji_decomposition.json",
  SIMILAR_KANJIS: "/json/v2/similar_kanjis.json",
  KANJI_READING_DETAILS: "/json/v2/kanji_reading_details.json",
  // One merged file in place of the four per-source structure files: 50 KB
  // gzipped against 66 KB over four requests.
  KANJI_STRUCTURES: "/json/v2/kanji_structures.json",
  ICON_SVG: "/img/app-icon.svg",
  SPEED_KATAKANA_CHALLENGE_SET: "/json/katakana/challenge-set-", // append `<setNumber>.json`
  SPEED_KATAKANA_CORRECT_SOUND: "/sounds/correct.mp3",
};

export const SAMPLE_VOCAB_PATH =
  import.meta.env.MODE === "development" || window.location.protocol === "http:"
    ? assetsPaths.dev.KANJI_VOCAB
    : assetsPaths.KANJI_VOCAB;

export const TEXT_BOOK_VOCAB_PATH =
  import.meta.env.MODE === "development" || window.location.protocol === "http:"
    ? assetsPaths.dev.TEXT_BOOK_VOCAB
    : assetsPaths.TEXT_BOOK_VOCAB;

export default assetsPaths;
