/**
 * One row of public/json/fill-the-kanji/<set>.json, as written by
 * scripts/generate-fill-the-kanji.mjs. `emoji` is only present in the emoji
 * set (where `tags` is empty).
 */
export type FillTheKanjiRow =
  | [jp: string, en: string, tags: string, notes: string]
  | [jp: string, en: string, tags: string, notes: string, emoji: string];

export type FillTheKanjiSetFile = { data: FillTheKanjiRow[] };

export type FillTheKanjiItem = {
  /** Sentence in Anki furigana format, e.g. "電車[でんしゃ]で 行[い]く". */
  jp: string;
  en: string;
  tags: string[];
  notes: string;
  emoji: string | null;
};

export const rowToItem = ([
  jp,
  en,
  tags,
  notes,
  emoji,
]: FillTheKanjiRow): FillTheKanjiItem => ({
  jp,
  en,
  tags: tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean),
  notes,
  emoji: emoji || null,
});
