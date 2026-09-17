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

/** public/json/v2/radicals.json — fetched at runtime, never imported. */
export type RadicalsFile = {
  groupedByStrokeCount: Record<string, string[]>;
  aliases: Record<string, string>;
  searchRedirects: Record<string, string>;
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
  searchRedirects: file.searchRedirects ?? {},
  strokeCountMap: strokeCountMapFromGrouped(file.groupedByStrokeCount),
});

/**
 * Map a displayed component to the codepoint the radical drawer / decomposition
 * index actually uses. Alias tables can point at a prettier glyph (艸 → 艹) or
 * cycle (艹 ↔ ⺾); walk until we hit a selectable radical.
 */
export const resolveRadicalForSearch = (
  radical: string,
  radicals: RadicalsRuntime | null | undefined
): string => {
  if (radicals == null) return radical;
  const seen = new Set<string>();
  let current = radical;
  while (current && !seen.has(current)) {
    seen.add(current);
    if (current in radicals.strokeCountMap) return current;
    const next = radicals.searchRedirects[current] ?? radicals.aliases[current];
    if (!next) return current;
    current = next;
  }
  return radical;
};

export const isKnownRadical = (
  char: string,
  radicals: RadicalsRuntime | null | undefined
): boolean =>
  radicals != null &&
  (char in radicals.strokeCountMap ||
    char in radicals.aliases ||
    char in radicals.searchRedirects);
