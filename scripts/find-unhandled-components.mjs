/**
 * Finds components in component_keyword.json that are NOT handled in radicals.ts.
 *
 * "Handled in radicals.ts" means the component appears in at least one of:
 *   1. radicalsGroupedByStrokeCount (is a radical)
 *   2. moreRadicalKeywords (has a radical keyword)
 *   3. radicalFalseFriends keys (is a variant form)
 *   4. radicalFalseFriends values (is a canonical form)
 *
 * Also checks if the component exists in kanji_main.json (as a full kanji).
 *
 * Usage: node scripts/find-unhandled-components.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Load data
const componentKeyword = JSON.parse(
  readFileSync(resolve(root, "public/json/component_keyword.json"), "utf-8")
);
const kanjiMain = JSON.parse(
  readFileSync(resolve(root, "public/json/kanji_main.json"), "utf-8")
);

// Radicals data (from radicals.ts)
const radicalsGroupedByStrokeCount = {
  1: ["一", "｜", "丶", "ノ", "乙", "亅"],
  2: ["二", "亠", "人", "⺅", "𠆢", "儿", "入", "ハ", "丷", "冂", "冖", "冫", "几", "凵", "刀", "⺉", "力", "勹", "匕", "匚", "十", "卜", "卩", "厂", "厶", "又", "マ", "九", "ユ", "乃", "𠂉"],
  3: ["⻌", "口", "囗", "土", "士", "夂", "夕", "大", "女", "子", "宀", "寸", "小", "⺌", "尢", "尸", "屮", "山", "川", "巛", "工", "已", "巾", "干", "幺", "广", "廴", "廾", "弋", "弓", "ヨ", "彑", "彡", "彳", "⺖", "⺘", "⺡", "⺨", "⺾", "⻏", "⻖", "也", "亡", "及", "久"],
  4: ["⺹", "心", "戈", "戸", "手", "支", "攵", "文", "斗", "斤", "方", "无", "日", "曰", "月", "木", "欠", "止", "歹", "殳", "比", "毛", "氏", "气", "水", "火", "⺣", "爪", "父", "爻", "爿", "片", "牛", "犬", "⺭", "王", "元", "井", "勿", "尤", "五", "屯", "巴", "毋"],
  5: ["玄", "瓦", "甘", "生", "用", "田", "疋", "疒", "癶", "白", "皮", "皿", "目", "矛", "矢", "石", "示", "禸", "禾", "穴", "立", "⻂", "世", "巨", "冊", "母", "⺲", "牙"],
  6: ["瓜", "竹", "米", "糸", "缶", "羊", "羽", "而", "耒", "耳", "聿", "肉", "自", "至", "臼", "舌", "舟", "艮", "色", "虍", "虫", "血", "行", "衣", "西"],
  7: ["臣", "見", "角", "言", "谷", "豆", "豕", "豸", "貝", "赤", "走", "足", "身", "車", "辛", "辰", "酉", "釆", "里", "舛", "麦"],
  8: ["金", "長", "門", "隶", "隹", "雨", "青", "非", "奄", "岡", "免", "斉"],
  9: ["面", "革", "韭", "音", "頁", "風", "飛", "食", "首", "香", "品"],
  10: ["馬", "骨", "高", "髟", "鬥", "鬯", "鬲", "鬼", "竜", "韋"],
  11: ["魚", "鳥", "鹵", "鹿", "麻", "亀", "啇", "黄", "黒"],
  12: ["黍", "黹", "無", "歯"],
  13: ["黽", "鼎", "鼓", "鼠"],
  14: ["鼻", "齊"],
  17: ["龠"],
};

const allRadicals = new Set(
  Object.values(radicalsGroupedByStrokeCount).flat()
);

const moreRadicalKeywords = new Set([
  "｜", "ノ", "⺅", "𠆢", "ハ", "丷", "⺉", "マ", "ユ", "𠂉",
  "⻌", "⺌", "已", "ヨ", "⺖", "⺘", "⺡", "⺨", "⺾", "⻏",
  "⻖", "⺹", "无", "曰", "⺣", "爻", "爿", "⺭", "尤", "禸",
  "⻂", "⺲", "韭", "髟", "鬥", "鬯", "鬲", "鹵", "黍", "黹",
  "黽", "鼎", "鼠", "齊", "龠",
]);

const radicalFalseFriendsKeys = new Set([
  "罒", "灬", "艹", "亻", "刂", "辶", "忄", "扌", "氵", "礻",
  "彐", "耂", "丿", "丨",
]);

const radicalFalseFriendsValues = new Set([
  "⺲", "⺣", "⺾", "⺅", "⺉", "⻌", "⺖", "⺘", "⺡", "⺭",
  "ヨ", "⺹", "ノ", "｜",
]);

// Check each component_keyword entry
const kanjiMainKeys = new Set(Object.keys(kanjiMain));

const unhandled = [];
const handledBreakdown = { radical: 0, moreKeyword: 0, falseFriendKey: 0, falseFriendVal: 0, alsoKanji: 0 };

for (const [component, keyword] of Object.entries(componentKeyword)) {
  const inRadicals = allRadicals.has(component);
  const inMoreKeywords = moreRadicalKeywords.has(component);
  const inFalseFriendsKey = radicalFalseFriendsKeys.has(component);
  const inFalseFriendsVal = radicalFalseFriendsValues.has(component);
  const inKanjiMain = kanjiMainKeys.has(component);

  if (inRadicals) handledBreakdown.radical++;
  if (inMoreKeywords) handledBreakdown.moreKeyword++;
  if (inFalseFriendsKey) handledBreakdown.falseFriendKey++;
  if (inFalseFriendsVal) handledBreakdown.falseFriendVal++;

  const handledInRadicalsTs = inRadicals || inMoreKeywords || inFalseFriendsKey || inFalseFriendsVal;

  if (!handledInRadicalsTs) {
    if (inKanjiMain) handledBreakdown.alsoKanji++;
    unhandled.push({
      component,
      keyword,
      inKanjiMain,
      codePoint: [...component]
        .map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"))
        .join(" "),
    });
  }
}

// Output
console.log("=".repeat(60));
console.log("UNHANDLED COMPONENTS REPORT");
console.log("component_keyword.json entries NOT in radicals.ts");
console.log("=".repeat(60));

console.log(`\n--- Stats ---`);
console.log(`Total in component_keyword.json: ${Object.keys(componentKeyword).length}`);
console.log(`Handled in radicals.ts: ${Object.keys(componentKeyword).length - unhandled.length}`);
console.log(`  - in radicalsGroupedByStrokeCount: ${handledBreakdown.radical}`);
console.log(`  - in moreRadicalKeywords: ${handledBreakdown.moreKeyword}`);
console.log(`  - in radicalFalseFriends (as key): ${handledBreakdown.falseFriendKey}`);
console.log(`  - in radicalFalseFriends (as value): ${handledBreakdown.falseFriendVal}`);
console.log(`NOT handled in radicals.ts: ${unhandled.length}`);
console.log(`  - of which also in kanji_main.json: ${handledBreakdown.alsoKanji}`);

console.log(`\n--- Key Takeaways ---`);
console.log(`- ${unhandled.length} components in component_keyword.json have no entry in radicals.ts`);
console.log(`- ${handledBreakdown.alsoKanji} of these are also full kanji (in kanji_main.json), so they`);
console.log(`  are reachable via kanji lookup but not via radical search`);
console.log(`- The remaining ${unhandled.length - handledBreakdown.alsoKanji} are neither kanji nor radicals — they`);
console.log(`  only exist in component_keyword.json`);

console.log(`\n--- Full Table ---\n`);
console.log("Component | Keyword              | Also in kanji_main?");
console.log("--------- | -------------------- | -------------------");
for (const { component, keyword, inKanjiMain, codePoint } of unhandled) {
  console.log(
    `${component}  (${codePoint})`.padEnd(22) +
      `| ${keyword.padEnd(21)}| ${inKanjiMain ? "YES" : "no"}`
  );
}

console.log(`\n--- Plain list (${unhandled.length} components, copy-paste friendly) ---\n`);
console.log(unhandled.map((m) => m.component).join(" "));
