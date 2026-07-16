/** Route metadata only — no screen Components, so ListScreen can import safely. */

export const recognitionPracticePageMeta = {
  href: "/reading-practice",
  title: "Kanji Reading Practice",
  shortLabel: "Kanji Reading",
  heading: "👁️ Kanji Reading",
  description: "Type the correct reading for each word",
} as const;

export const productionPracticePageMeta = {
  href: "/writing-practice",
  title: "Kanji Writing Practice",
  shortLabel: "Kanji Writing",
  heading: "✍️ Kanji Writing",
  description: "Complete words by drawing the missing kanji",
} as const;

export const speedKatakanaPageMeta = {
  href: "/speed-katakana",
  title: "Speed Katakana",
  shortLabel: "Speed Katakana",
  heading: "🐇 Speed Katakana",
  description: "Type katakana words as quickly as you can",
} as const;

export const practicePageLinks = [
  recognitionPracticePageMeta,
  productionPracticePageMeta,
  speedKatakanaPageMeta,
] as const;
