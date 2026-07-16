/** Route metadata only — no screen Components, so ListScreen can import safely. */

export const recognitionPracticePageMeta = {
  href: "/recognition-practice",
  title: "Kanji Recognition Practice",
  heading: "👁️ Kanji Recognition",
  description: "Type the correct reading for each word",
} as const;

export const productionPracticePageMeta = {
  href: "/production-practice",
  title: "Kanji Production Practice",
  heading: "✍️ Kanji Production",
  description: "Complete words by drawing the missing kanji",
} as const;

export const speedKatakanaPageMeta = {
  href: "/speed-katakana",
  title: "Speed Katakana",
  heading: "🐇 Speed Katakana",
  description: "Type katakana words as quickly as you can",
} as const;

export const practicePageLinks = [
  recognitionPracticePageMeta,
  productionPracticePageMeta,
  speedKatakanaPageMeta,
] as const;
