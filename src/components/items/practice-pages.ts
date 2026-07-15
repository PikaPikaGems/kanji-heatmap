/** Route metadata only — no screen Components, so ListScreen can import safely. */

export const recognitionPracticePageMeta = {
  href: "/recognition-practice",
  title: "Kanji Recognition",
  description: "Type the reading of kanji anchor words",
} as const;

export const productionPracticePageMeta = {
  href: "/production-practice",
  title: "Kanji Production",
  description: "Draw the missing kanji in anchor words",
} as const;

export const speedKatakanaPageMeta = {
  href: "/speed-katakana",
  title: "Speed Katakana",
  description: "Practice speed typing katakana words",
} as const;

export const practicePageLinks = [
  recognitionPracticePageMeta,
  productionPracticePageMeta,
  speedKatakanaPageMeta,
] as const;
