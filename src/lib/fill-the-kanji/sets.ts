/**
 * The Fill the Kanji challenge sets, in display order.
 *
 * `id` must match the set's folder, public/json/fill-the-kanji/<id>/, and is
 * also the key used for stored stats, so renaming an id loses the stats recorded under it.
 * `unit` names what the set holds in the download settings ("5,100+ sentences");
 * the size and count there come from the generated download-sizes.json and
 * set-sizes.json.
 */
export const FILL_THE_KANJI_SETS = [
  {
    id: "everyday-phrases-onomatopoeia",
    label: "💬 Everyday Phrases",
    unit: "sentences",
  },
  {
    id: "short-phrases",
    label: "⚡ Short Phrases",
    unit: "phrases",
  },
  { id: "n5", label: "🐣 N5 Grammar", unit: "sentences" },
  { id: "n4", label: "🐥 N4 Grammar", unit: "sentences" },
  { id: "n3", label: "🐔 N3 Grammar", unit: "sentences" },
  { id: "n2", label: "🦅 N2 Grammar", unit: "sentences" },
  { id: "n1", label: "🐉 N1 Grammar", unit: "sentences" },
  {
    id: "intermediate",
    label: "📚 Misc Grammar",
    unit: "sentences",
  },
  {
    id: "beginner-1",
    label: "🌱 Basic",
    unit: "sentences",
  },
  {
    id: "beginner-2",
    label: "☘️ Common",
    unit: "sentences",
  },
  {
    id: "beginner-3",
    label: "🌷 Fluent",
    unit: "sentences",
  },
  {
    id: "verb-focused",
    label: "🏃 Verbs",
    unit: "sentences",
  },
  { id: "emoji", label: "😀 Emoji", unit: "emoji" },
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
