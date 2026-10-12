export const URL_PARAMS = {
  openKanji: "open",
  textSearch: {
    type: "search-type",
    text: "search-text",
  },
  filterSettings: {
    strokeRange: { min: "filter-stroke-min", max: "filter-stroke-max" },
    jlpt: "filter-jlpt",
    jouyouGrade: "filter-jouyou-grade",
    freq: {
      source: "filter-freq-source",
      rankRange: { min: "filter-freq-rank-min", max: "filter-freq-rank-max" },
    },
    bookmarkedOnly: "filter-bookmarked-only",
    withAnchorWordsOnly: "filter-anchor-words-only",
  },
  sortSettings: {
    primary: "sort-primary",
    secondary: "sort-secondary",
  },
  bgSrc: "bg-src",
  /** Speed Katakana challenge set id (`/speed-katakana?challenge=200`). */
  challenge: "challenge",
  /** Fill the Kanji set and batch (`/fill-the-kanji?set=n4&batch=12`). */
  fillTheKanjiSet: "set",
  fillTheKanjiBatch: "batch",
} as const;
