const assetsPaths = {
  MAIN_KANJI_INFO_FILE_PATH: "/json/kanji_main.json",
  EXTENDED_KANJI_INFO_FILE_PATH: "/json/kanji_extended.json",
  PHONETIC_FILE: "/json/phonetic.json",
  PART_KEYWORD_FILE: "/json/component_keyword.json",
  VOCAB_MEANING: "/json/vocab_meaning.json",
  VOCAB_FURIGANA: "/json/vocab_furigana.json",
  CUM_USE: "json/cum_use.json",
  KANJI_SVGS: "https://assets.pikapikagems.com/kanji/",
  KANJI_VOCAB: "https://assets.pikapikagems.com/kanji-common-words/v1", // Note: No slash at the end is intentional
  dev: {
    KANJI_SVGS: "https://kanjivg.tagaini.net/kanjivg/kanji/",
    KANJI_VOCAB: "/kanji-words/v1", // Note: No slash at the end is intentional
  },
  KANJI_DECOMPOSITION: "/json/kanji_decomposition.json",
  KANJI_READING_DETAILS: "/json/kanji-readings-details.json",
  KANJI_STRUCTURE_DETAILS: "/json/kanji-structure.json",
  ICON_SVG: "/img/app-icon.svg",
};

export default assetsPaths;
