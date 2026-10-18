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
  { id: "everyday-1", label: "💬 Everyday 1", unit: "sentences" },
  { id: "everyday-2", label: "💬 Everyday 2", unit: "sentences" },
  { id: "everyday-3", label: "💬 Everyday 3", unit: "sentences" },
  { id: "short-phrases-2", label: "⚡ Short Phrases", unit: "phrases" },
  { id: "n5", label: "🥚 N5 Grammar", unit: "sentences" },
  { id: "n4", label: "🐣 N4 Grammar", unit: "sentences" },
  { id: "n3", label: "🐥 N3 Grammar", unit: "sentences" },
  { id: "n2", label: "🦢 N2 Grammar", unit: "sentences" },
  { id: "n1", label: "🐦‍🔥 N1 Grammar", unit: "sentences" },
  {
    id: "intermediate",
    label: "🦆 Misc Grammar",
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
  { id: "verb-1", label: "🏃 Verbs I", unit: "sentences" },
  { id: "verb-2", label: "🏃 Verbs II", unit: "sentences" },
  { id: "verb-3", label: "🏃 Verbs III", unit: "sentences" },
  { id: "verb-4", label: "🏃 Verbs IV", unit: "sentences" },
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
    setIds: ["everyday-1", "everyday-2", "everyday-3", "short-phrases-2"],
  },
  {
    title: "Grammar Sentences",
    setIds: ["n5", "n4", "n3", "n2", "n1", "intermediate"],
  },
  {
    title: "Basic to Fluent",
    setIds: ["beginner-1", "beginner-2", "beginner-3"],
  },
  {
    title: "Verbs and Emoji",
    setIds: ["verb-1", "verb-2", "verb-3", "verb-4", "emoji"],
  },
];
