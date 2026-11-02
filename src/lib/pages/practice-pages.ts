/** Route metadata only — no screen Components, so ListScreen can import safely. */

export const recognitionPracticePageMeta = {
  href: "/reading-practice",
  title: "Reading Practice",
  shortLabel: "Reading Practice",
  heading: "👁️ Reading Practice",
  description: "Type the correct reading for each word",
} as const;

export const productionPracticePageMeta = {
  href: "/writing-practice",
  title: "Writing Practice",
  shortLabel: "Writing Practice",
  heading: "✍️ Writing Practice",
  description: "Complete words by drawing the missing kanji",
} as const;

export const readingMasteryPageMeta = {
  href: "/reading-mastery",
  title: "Reading Mastery",
  shortLabel: "Reading Mastery",
  heading: "👁️ Kanji Reading Mastery",
  description: "Review due readings from your review pile",
} as const;

export const writingMasteryPageMeta = {
  href: "/writing-mastery",
  title: "Writing Mastery",
  shortLabel: "Writing Mastery",
  heading: "✍️ Kanji Writing Mastery",
  description: "Review due kanji writing from your review pile",
} as const;

export const speedKatakanaPageMeta = {
  href: "/speed-katakana",
  title: "Speed Katakana",
  shortLabel: "Speed Katakana",
  heading: "🐇 Speed Katakana",
  description: "Type katakana words as quickly as you can",
} as const;

export const fillTheKanjiPageMeta = {
  href: "/fill-in-the-kanji",
  title: "Fill in the Kanji",
  shortLabel: "Fill in the Kanji",
  heading: "🧩 Fill in the Kanji",
  description: "Complete sentences by picking the missing kanji",
} as const;

export const practicePageLinks = [
  recognitionPracticePageMeta,
  productionPracticePageMeta,
  readingMasteryPageMeta,
  writingMasteryPageMeta,
  fillTheKanjiPageMeta,
  speedKatakanaPageMeta,
] as const;
