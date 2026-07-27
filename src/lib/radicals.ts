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

==============
"⻏",
"⻖",

"口",
"囗",

"土",
"士",

"夂",
"夕",

"小",
"⺌",

"川",
"巛",

"⻏",
"⻖",

"日",
"曰",
*/

import radicalsData from "../../raw-data/radicals.json";

// The tables below are generated data, not code: they live in
// raw-data/radicals.json so the JSON generator and the app read exactly the
// same source. Edit the JSON, never these bindings.
export const radicalsGroupedByStrokeCount =
  radicalsData.radicalsGroupedByStrokeCount;

export const moreRadicalKeywords: Record<string, string> =
  radicalsData.moreRadicalKeywords;

export const nonRadicalVariantKeywords: Record<string, string> =
  radicalsData.nonRadicalVariantKeywords;

/**
 * Lookalike characters that should resolve to another entry: different
 * Unicode codepoints that mean the same component (罒 vs ⺲, 亻 vs ⺅, ...).
 */
export const radicalFalseFriends: Record<string, string> =
  radicalsData.radicalFalseFriends;

// IMPORTANT NOTE THINGS I HAVE DONE:
// Updated kanji-structure.json
// 1.  艸 -> 艹
// 2.  ⽊ (radical) -> 木 (kanji)
// FIX ME: What is 丩 ?

// returns Record<Radical, StrokeCount>
function transformRadicalsData(): Record<string, string> {
  const output: Record<string, string> = {};

  Object.entries(radicalsGroupedByStrokeCount).forEach(([stroke, radicals]) => {
    radicals.forEach((radical) => {
      output[radical] = stroke;
    });
  });

  return output;
}
export const radicalStrokeCountMap: Record<string, string> =
  transformRadicalsData();

export const isKnownRadical = (char: string): boolean =>
  char in radicalStrokeCountMap || char in radicalFalseFriends;
