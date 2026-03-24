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
export const radicalsGroupedByStrokeCount = {
  "1": ["一", "｜", "丶", "ノ", "乙", "亅"],
  "2": [
    "二",
    "亠",
    "人",
    "⺅",
    "𠆢",
    "儿",
    "入",
    "ハ",
    "丷",
    "冂",
    "冖",
    "冫",
    "几",
    "凵",
    "刀",
    "⺉",
    "力",
    "勹",
    "匕",
    "匚",
    "十",
    "卜",
    "卩",
    "厂",
    "厶",
    "又",
    "マ",
    "九",
    "ユ",
    "乃",
    "𠂉",
  ],
  "3": [
    "⻌",
    "口",
    "囗",
    "土",
    "士",
    "夂",
    "夕",
    "大",
    "女",
    "子",
    "宀",
    "寸",
    "小",
    "⺌",
    "尢",
    "尸",
    "屮",
    "山",
    "川",
    "巛",
    "工",
    "已",
    "巾",
    "干",
    "幺",
    "广",
    "廴",
    "廾",
    "弋",
    "弓",
    "ヨ",
    "彑",
    "彡",
    "彳",
    "⺖",
    "⺘",
    "⺡",
    "⺨",
    "⺾",
    "⻏",
    "⻖",
    "也",
    "亡",
    "及",
    "久",
  ],
  "4": [
    "⺹",
    "心",
    "戈",
    "戸",
    "手",
    "支",
    "攵",
    "文",
    "斗",
    "斤",
    "方",
    "无",
    "日",
    "曰",
    "月",
    "木",
    "欠",
    "止",
    "歹",
    "殳",
    "比",
    "毛",
    "氏",
    "气",
    "水",
    "火",
    "⺣",
    "爪",
    "父",
    "爻",
    "爿",
    "片",
    "牛",
    "犬",
    "⺭",
    "王",
    "元",
    "井",
    "勿",
    "尤",
    "五",
    "屯",
    "巴",
    "毋",
  ],
  "5": [
    "玄",
    "瓦",
    "甘",
    "生",
    "用",
    "田",
    "疋",
    "疒",
    "癶",
    "白",
    "皮",
    "皿",
    "目",
    "矛",
    "矢",
    "石",
    "示",
    "禸",
    "禾",
    "穴",
    "立",
    "⻂",
    "世",
    "巨",
    "冊",
    "母",
    "⺲",
    "牙",
  ],
  "6": [
    "瓜",
    "竹",
    "米",
    "糸",
    "缶",
    "羊",
    "羽",
    "而",
    "耒",
    "耳",
    "聿",
    "肉",
    "自",
    "至",
    "臼",
    "舌",
    "舟",
    "艮",
    "色",
    "虍",
    "虫",
    "血",
    "行",
    "衣",
    "西",
  ],
  "7": [
    "臣",
    "見",
    "角",
    "言",
    "谷",
    "豆",
    "豕",
    "豸",
    "貝",
    "赤",
    "走",
    "足",
    "身",
    "車",
    "辛",
    "辰",
    "酉",
    "釆",
    "里",
    "舛",
    "麦",
  ],
  "8": ["金", "長", "門", "隶", "隹", "雨", "青", "非", "奄", "岡", "免", "斉"],
  "9": ["面", "革", "韭", "音", "頁", "風", "飛", "食", "首", "香", "品"],
  "10": ["馬", "骨", "高", "髟", "鬥", "鬯", "鬲", "鬼", "竜", "韋"],
  "11": ["魚", "鳥", "鹵", "鹿", "麻", "亀", "啇", "黄", "黒"],
  "12": ["黍", "黹", "無", "歯"],
  "13": ["黽", "鼎", "鼓", "鼠"],
  "14": ["鼻", "齊"],
  "17": ["龠"],
};

export const moreRadicalKeywords: Record<string, string> = {
  "｜": "vertical line",
  ノ: "diagonal stroke",
  "⺅": "thin person",
  "𠆢": "person hat",
  ハ: "eight variant",
  丷: "double dot",
  "⺉": "sun variant",
  マ: "katakana ma",
  ユ: "hook variant",
  "𠂉": "gun person",
  "⻌": "movement radical",
  "⺌": "small variant",
  已: "snake variant",
  ヨ: "katakana yo",
  "⺖": "heart variant",
  "⺘": "thin hand",
  "⺡": "water variant",
  "⺨": "dog variant",
  "⺾": "grass variant",
  "⻏": "beta right",
  "⻖": "beta left",
  "⺹": "sound variant",
  无: "nothingness",
  曰: "speaking box",
  "⺣": "small fire variant",
  爻: "xx",
  爿: "split wood",
  "⺭": "spirit / katakana ne",
  尤: "peculiar",
  禸: "track",
  "⻂": "shell variant",
  "⺲": "small net / fish variant",
  韭: "leek",
  髟: "long hair",
  鬥: "fighting",
  鬯: "aromatic wine",
  鬲: "cauldron",
  鹵: "salt",
  黍: "millet",
  黹: "embroidery",
  黽: "frog",
  鼎: "tripod",
  鼠: "rodent",
  齊: "even teeth",
  龠: "flute",
};

export const radicalFalseFriends: Record<string, string> = {
  // 艸, 廾 <--- 艹 (from component keyword), ⺾ (from moreRadicals.ts)
  // ⽊ <-- tree (radical), tree (radical 木)

  // ⺲ "fish variant/small net"
  // 罒 small net
  // small net -> fish variant / small net
  罒: "⺲",

  // 灬 fire sparks
  // ⺣ small fire variant
  // fire sparks -> small fire variant
  灬: "⺣",
  艹: " ⺾",
  亻: "⺅",
  刂: "⺉",
  辶: "⻌",
  忄: "⺖",
  扌: "⺘",
  氵: "⺡",
  礻: "⺭",
  彐: "ヨ",
  耂: "⺹",
  丿: "ノ",
  丨: "｜",
  // TODO CONFIRM IF CORRECT

  /** TODO: How to handle this? 
阝 → could be either ⻏ (right) or ⻖ (left), ambiguous without position context
衤 → related to 衣 but 衣 itself is in the radicals list (not a variant form like ⺅)
飠 → related to 食, same situation as 衤   */
};

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
