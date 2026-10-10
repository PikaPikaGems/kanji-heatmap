/**
 * The Fill the Kanji challenge sets, in display order.
 *
 * `id` must match a file stem written by scripts/generate-fill-the-kanji.mjs
 * (the source TSV name without its trailing "-<count>"), and is also the key
 * used for stored stats, so renaming an id loses the stats recorded under it.
 * `sizeHint` is approximate and only shown in the download settings.
 * TODO: it's hand-written, so it goes stale if a TSV changes. Derive it from
 * the generated files instead.
 */
export const FILL_THE_KANJI_SETS = [
  {
    id: "everyday-phrases-onomatopoeia",
    label: "💬 Everyday Phrases",
    sizeHint: "~940 KB · 5,250 sentences",
  },
  {
    id: "short-phrases",
    label: "⚡ Short Phrases",
    sizeHint: "~230 KB · 2,500 phrases",
  },
  { id: "n5", label: "🐣 N5 Grammar", sizeHint: "~200 KB · 750 sentences" },
  { id: "n4", label: "🐥 N4 Grammar", sizeHint: "~330 KB · 1,350 sentences" },
  { id: "n3", label: "🐔 N3 Grammar", sizeHint: "~510 KB · 1,900 sentences" },
  { id: "n2", label: "🦅 N2 Grammar", sizeHint: "~600 KB · 1,950 sentences" },
  { id: "n1", label: "🐉 N1 Grammar", sizeHint: "~690 KB · 2,200 sentences" },
  {
    id: "intermediate",
    label: "📚 Misc Grammar",
    sizeHint: "~640 KB · 1,100 sentences",
  },
  {
    id: "beginner-1",
    label: "🌱 Basic",
    sizeHint: "~720 KB · 4,800 sentences",
  },
  {
    id: "beginner-2",
    label: "☘️ Common",
    sizeHint: "~860 KB · 5,550 sentences",
  },
  {
    id: "beginner-3",
    label: "🌷 Fluent",
    sizeHint: "~560 KB · 3,200 sentences",
  },
  {
    id: "verb-focused",
    label: "🏃 Verbs",
    sizeHint: "~1.2 MB · 5,450 sentences",
  },
  { id: "emoji", label: "😀 Emoji", sizeHint: "~110 KB · 1,350 emoji" },
] as const;

export type FillTheKanjiSetId = (typeof FILL_THE_KANJI_SETS)[number]["id"];
