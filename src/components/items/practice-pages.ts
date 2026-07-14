/** Route metadata only — no screen Components, so ListScreen can import safely. */

export const recognitionPracticePageMeta = {
  href: "/recognition-practice",
  title: "Kanji Recognition Practice",
  description: "Type the reading of kanji anchor words",
} as const;

export const speedKatakanaPageMeta = {
  href: "/speed-katakana",
  title: "Speed Katakana",
  description: "Practice speed typing katakana words",
} as const;

export const practicePageLinks = [
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
] as const;
