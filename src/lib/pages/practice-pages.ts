/** Route metadata only — no screen Components, so ListScreen can import safely. */

// Titles keep "I" / "II" on the line of the word before them (no-break
// space), so a narrow menu tile never leaves the numeral on its own line.
export type PracticePageMeta = {
  href: string;
  title: string;
  shortLabel: string;
  heading: string;
  description: string;
};

export const recognitionPracticePageMeta = {
  href: "/reading-practice",
  title: "Reading Practice\u00a0I",
  shortLabel: "Reading Practice I",
  heading: "👁️ Reading Practice I",
  description: "Type the correct reading for each word",
} as const;

export const recognitionPractice2PageMeta = {
  href: "/reading-practice-2",
  title: "Reading Practice\u00a0II",
  shortLabel: "Reading Practice II",
  heading: "👁️ Reading Practice II",
  description: "Type the correct reading for each kanji's second word",
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
  title: "Reading Mastery\u00a0I",
  shortLabel: "Reading Mastery I",
  heading: "👁️ Kanji Reading Mastery I",
  description: "Review due readings from your review pile",
} as const;

export const readingMastery2PageMeta = {
  href: "/reading-mastery-2",
  title: "Reading Mastery\u00a0II",
  shortLabel: "Reading Mastery II",
  heading: "👁️ Kanji Reading Mastery II",
  description: "Review due second-word readings from your review pile",
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
  recognitionPractice2PageMeta,
  productionPracticePageMeta,
  readingMasteryPageMeta,
  readingMastery2PageMeta,
  writingMasteryPageMeta,
  fillTheKanjiPageMeta,
  speedKatakanaPageMeta,
] as const;
