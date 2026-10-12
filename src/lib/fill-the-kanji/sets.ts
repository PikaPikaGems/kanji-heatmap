/**
 * The Fill the Kanji challenge sets, in display order.
 *
 * `id` must match a file stem written by jp-misc-data's kanji-heatmap-build/scripts/generate-fill-the-kanji.mjs
 * (the source TSV name without its trailing "-<count>"), and is also the key
 * used for stored stats, so renaming an id loses the stats recorded under it.
 * `sizeHint` (download size) is approximate and only shown in the download
 * settings, next to a row count derived from set-sizes.json and `unit`.
 * TODO: the size is hand-written, so it goes stale if a TSV changes. Derive
 * it from the generated files instead.
 */
export const FILL_THE_KANJI_SETS = [
  {
    id: "everyday-phrases-onomatopoeia",
    label: "💬 Everyday Phrases",
    sizeHint: "~940 KB",
    unit: "sentences",
  },
  {
    id: "short-phrases",
    label: "⚡ Short Phrases",
    sizeHint: "~230 KB",
    unit: "phrases",
  },
  { id: "n5", label: "🐣 N5 Grammar", sizeHint: "~200 KB", unit: "sentences" },
  { id: "n4", label: "🐥 N4 Grammar", sizeHint: "~330 KB", unit: "sentences" },
  { id: "n3", label: "🐔 N3 Grammar", sizeHint: "~510 KB", unit: "sentences" },
  { id: "n2", label: "🦅 N2 Grammar", sizeHint: "~600 KB", unit: "sentences" },
  { id: "n1", label: "🐉 N1 Grammar", sizeHint: "~690 KB", unit: "sentences" },
  {
    id: "intermediate",
    label: "📚 Misc Grammar",
    sizeHint: "~640 KB",
    unit: "sentences",
  },
  {
    id: "beginner-1",
    label: "🌱 Basic",
    sizeHint: "~720 KB",
    unit: "sentences",
  },
  {
    id: "beginner-2",
    label: "☘️ Common",
    sizeHint: "~860 KB",
    unit: "sentences",
  },
  {
    id: "beginner-3",
    label: "🌷 Fluent",
    sizeHint: "~560 KB",
    unit: "sentences",
  },
  {
    id: "verb-focused",
    label: "🏃 Verbs",
    sizeHint: "~1.2 MB",
    unit: "sentences",
  },
  { id: "emoji", label: "😀 Emoji", sizeHint: "~110 KB", unit: "emoji" },
] as const;

export type FillTheKanjiSetId = (typeof FILL_THE_KANJI_SETS)[number]["id"];

/** Dashboard heatmap groups, in display order. Every set belongs to one. */
export const FILL_THE_KANJI_SET_GROUPS: {
  title: string;
  setIds: FillTheKanjiSetId[];
}[] = [
  {
    title: "Everyday Japanese",
    setIds: ["everyday-phrases-onomatopoeia", "short-phrases"],
  },
  {
    title: "Grammar Sentences",
    setIds: ["n5", "n4", "n3", "n2", "n1", "intermediate"],
  },
  {
    title: "Basic to Fluent",
    setIds: ["beginner-1", "beginner-2", "beginner-3"],
  },
  { title: "Verbs and Emoji", setIds: ["verb-focused", "emoji"] },
];
