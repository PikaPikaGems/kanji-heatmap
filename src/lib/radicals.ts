/*
Credits to this project: https://github.com/rewhowe/kanji/tree/develop

# Alternate forms

Radical | Alternate Form
人	⺅
八	丷
氷	冫
刀	⺉
小	⺌
川	巛
心	⺖
手	⺘
水	⺡
火	灬
犬	⺨
草	⺾

# Look alike radicals

- (hyphen) or ー (elongated-vowel)	            一
^ (circumflex) or ＾ (full-width circumflex)	𠆢
+ (plus) or ＋ (full-width plus)	            十
| (pipe) or ｜ (full-width pipe)	            ｜
J or Ｊ (full-width J)	                        亅
B or Ｂ (full-width B)	                        ⻏, ⻖
ル (katakana 'ru')	                            儿
リ (katakana 'ri')	                            ⺉
カ (katakana 'ka')	                            力
ヒ (katakana 'hi')	                            匕
イ (katakana 'i')	                            ⺅
ト (katakana 'to')	                            卜
ム (katakana 'mu')	                            厶
エ (katakana 'e')	                            工
ネ (katakana 'ne')	                            ⺭, ⻂
囗 (※) or 口 (※) or ロ (katakana 'ro')	         囗, 口
*/

/** Radical popover facts. The English name is the component keyword. */
export type RadicalInfo = {
  /** Japanese name, e.g. さんずい. */
  ja: string;
  /** Position: へん, つくり, かんむり, あし, たれ, にょう or かまえ. */
  pos?: string;
  /** Meaning, e.g. "water". */
  cn?: string;
};

/**
 * Our own radical popover text (raw-data/radicals/ours-popover-text.json),
 * public/json/v2/radical_popover_text.json. Every field is optional; refs
 * are the links each line was checked against.
 */
export type RadicalPopoverText = {
  /** Why the Japanese name is what it is (🇯🇵 line). */
  ja?: string;
  jaRefs?: string[];
  /** Chinese origin of the glyph (🇨🇳 line). */
  cn?: string;
  /** What is different about this form (⺡ "Written as three strokes…"). */
  cnNote?: string;
  refs?: string[];
  /** Kanji where the radical is the meaning part. */
  semantic?: { kanji: string; concepts: string; why: string; refs: string[] }[];
  /**
   * Kanji whose sound part (a learner hint, as on the sound-part chips) is
   * the radical, each with a word read with the family sound.
   */
  sound?: {
    kanji: string;
    word: string;
    reading: string;
    gloss: string;
    refs?: string[];
  }[];
};

/** The popover text plus the radical's sounds from the sound-parts data. */
export type RadicalPopoverDetails = RadicalPopoverText & { sounds?: string[] };

/** public/json/v2/radicals.json — fetched at runtime, never imported. */
export type RadicalsFile = {
  groupedByStrokeCount: Record<string, string[]>;
  aliases: Record<string, string>;
  info: Record<string, RadicalInfo>;
  /**
   * Head → [head, ...forms] (水 → 水, ⺡, 氺). A form is a glyph, or a
   * name-only row for a form with no glyph the app can show (きへん).
   */
  families?: Record<string, RadicalFamilyMember[]>;
};

export type RadicalFamilyMember = string | { ja: string; pos?: string };

export type RadicalsRuntime = RadicalsFile & {
  strokeCountMap: Record<string, string>;
};

export const strokeCountMapFromGrouped = (
  grouped: Record<string, string[]>
): Record<string, string> => {
  const output: Record<string, string> = {};
  for (const [stroke, list] of Object.entries(grouped)) {
    for (const radical of list) {
      output[radical] = stroke;
    }
  }
  return output;
};

export const prepareRadicals = (file: RadicalsFile): RadicalsRuntime => ({
  groupedByStrokeCount: file.groupedByStrokeCount,
  aliases: file.aliases ?? {},
  info: file.info ?? {},
  families: file.families ?? {},
  strokeCountMap: strokeCountMapFromGrouped(file.groupedByStrokeCount),
});

/**
 * Follow aliases from `char` (itself first) to the first glyph where `has` is
 * true. Each fact is stored once, on the alias target, so every lookup goes
 * through here: 氵 → ⺡ finds ⺡'s keyword. Alias tables can cycle (艹 ↔ ⺾),
 * so a repeat ends the walk. Returns null if nothing on the way matches.
 */
export const followAlias = (
  char: string,
  aliases: Record<string, string>,
  has: (glyph: string) => boolean
): string | null => {
  const seen = new Set<string>();
  let current: string | undefined = char;
  while (current != null && !seen.has(current)) {
    if (has(current)) return current;
    seen.add(current);
    current = aliases[current];
  }
  return null;
};

/**
 * Component keyword for a glyph, following aliases (氵 → "three water"). An
 * alias that reaches a kanji shows its kanji keyword (衤 → 衣 → "garment"):
 * kanji keywords live only in kanji_main, never in components.json.
 */
export const componentKeyword = (
  char: string,
  components: Record<string, { k?: string }>,
  aliases: Record<string, string>,
  kanjiKeyword: (kanji: string) => string | undefined
): string | undefined => {
  const glyph = followAlias(
    char,
    aliases,
    (g) => components[g]?.k != null || kanjiKeyword(g) != null
  );
  if (glyph == null) return undefined;
  return components[glyph]?.k ?? kanjiKeyword(glyph);
};

/** Radical popover facts for a glyph, following aliases. */
export const radicalInfo = (
  char: string,
  radicals: RadicalsRuntime | null | undefined
): RadicalInfo | undefined => {
  if (radicals == null) return undefined;
  const glyph = followAlias(char, radicals.aliases, (g) => g in radicals.info);
  return glyph == null ? undefined : radicals.info[glyph];
};

/**
 * The family a glyph belongs to, following aliases (氵 → ⺡, in 水's family):
 * its head, its forms in order, and the form the glyph is (`current`).
 * Null for a glyph in no family.
 */
export const radicalFamily = (
  char: string,
  radicals: Pick<RadicalsFile, "aliases" | "families"> | null | undefined
): {
  head: string;
  members: RadicalFamilyMember[];
  current: string;
} | null => {
  const families = radicals?.families;
  if (radicals == null || families == null) return null;
  const headOf = new Map<string, string>();
  for (const [head, members] of Object.entries(families)) {
    for (const member of members) {
      if (typeof member === "string") headOf.set(member, head);
    }
  }
  const current = followAlias(char, radicals.aliases, (g) => headOf.has(g));
  if (current == null) return null;
  const head = headOf.get(current)!;
  return { head, members: families[head], current };
};

/**
 * Map a displayed component to the codepoint the radical drawer / decomposition
 * index actually uses (艸 → 艹 → ⺾).
 */
export const resolveRadicalForSearch = (
  radical: string,
  radicals: RadicalsRuntime | null | undefined
): string =>
  radicals == null
    ? radical
    : (followAlias(
        radical,
        radicals.aliases,
        (g) => g in radicals.strokeCountMap
      ) ?? radical);

/**
 * A radical is anything that leads to a drawer radical, directly or through
 * aliases. An alias that never reaches the drawer (龺 → 𠦝) is just a
 * component: it has no radical info and nothing to search for.
 */
export const isKnownRadical = (
  char: string,
  radicals: RadicalsRuntime | null | undefined
): boolean =>
  radicals != null &&
  resolveRadicalForSearch(char, radicals) in radicals.strokeCountMap;
