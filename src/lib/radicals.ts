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

/** public/json/v2/radicals.json — fetched at runtime, never imported. */
export type RadicalsFile = {
  groupedByStrokeCount: Record<string, string[]>;
  aliases: Record<string, string>;
  info: Record<string, RadicalInfo>;
};

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

/** Component keyword for a glyph, following aliases (氵 → "three water"). */
export const componentKeyword = (
  char: string,
  components: Record<string, { k?: string }>,
  aliases: Record<string, string>
): string | undefined => {
  const glyph = followAlias(char, aliases, (g) => components[g]?.k != null);
  return glyph == null ? undefined : components[glyph].k;
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
