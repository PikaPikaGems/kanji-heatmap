/**
 * Scans kanji-structure.json and finds all semantic/phonetic components
 * that don't have a keyword in any of our known sources:
 *   1. kanji_main.json (as a kanji)
 *   2. component_keyword.json
 *   3. moreRadicalKeywords in radicals.ts (via radicalsGroupedByStrokeCount + moreRadicalKeywords)
 *   4. radicalFalseFriends in radicals.ts (variant mappings)
 *
 * Usage: node scripts/find-missing-components.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// 1. Load kanji-structure.json
const kanjiStructure = JSON.parse(
  readFileSync(resolve(root, "public/json/kanji-structure.json"), "utf-8")
);

// 2. Load kanji_main.json
const kanjiMain = JSON.parse(
  readFileSync(resolve(root, "public/json/kanji_main.json"), "utf-8")
);
const kanjiMainKeys = new Set(Object.keys(kanjiMain));

// 3. Load component_keyword.json
const componentKeyword = JSON.parse(
  readFileSync(resolve(root, "public/json/component_keyword.json"), "utf-8")
);
const componentKeywordKeys = new Set(Object.keys(componentKeyword));

// 4. Hardcode the known radicals, moreRadicalKeywords, and radicalFalseFriends
//    (extracted from radicals.ts to avoid needing a TS compiler)

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

// radicalFalseFriends: keys are the variant forms, values are the canonical forms
const radicalFalseFriendsKeys = new Set([
  "罒", "灬", "艹", "亻", "刂", "辶", "忄", "扌", "氵", "礻",
  "彐", "耂", "丿", "丨",
]);
const radicalFalseFriendsValues = new Set([
  "⺲", "⺣", "⺾", "⺅", "⺉", "⻌", "⺖", "⺘", "⺡", "⺭",
  "ヨ", "⺹", "ノ", "｜",
]);

// ---- Collect all semantic & phonetic components ----
const semanticComponents = new Set();
const phoneticComponents = new Set();

for (const [kanji, data] of Object.entries(kanjiStructure)) {
  if (data.semantic) semanticComponents.add(data.semantic);
  if (data.phonetic) phoneticComponents.add(data.phonetic);
}

const allComponents = new Set([...semanticComponents, ...phoneticComponents]);

// ---- Check each component ----
function isKnown(component) {
  return (
    kanjiMainKeys.has(component) ||
    componentKeywordKeys.has(component) ||
    allRadicals.has(component) ||
    moreRadicalKeywords.has(component) ||
    radicalFalseFriendsKeys.has(component) ||
    radicalFalseFriendsValues.has(component)
  );
}

const missing = [];
for (const component of allComponents) {
  if (!isKnown(component)) {
    // Determine where it's used
    const usedAsSemantic = semanticComponents.has(component);
    const usedAsPhonetic = phoneticComponents.has(component);
    const roles = [];
    if (usedAsSemantic) roles.push("semantic");
    if (usedAsPhonetic) roles.push("phonetic");

    // Count how many kanji use this component
    let count = 0;
    for (const data of Object.values(kanjiStructure)) {
      if (data.semantic === component || data.phonetic === component) count++;
    }

    missing.push({ component, roles: roles.join("+"), count });
  }
}

// Sort by usage count descending
missing.sort((a, b) => b.count - a.count);

// ---- Output ----
console.log("=".repeat(60));
console.log("FIND MISSING COMPONENTS REPORT");
console.log("=".repeat(60));

console.log(`\n--- Stats ---`);
console.log(`Total unique semantic components: ${semanticComponents.size}`);
console.log(`Total unique phonetic components: ${phoneticComponents.size}`);
console.log(`Total unique components (union): ${allComponents.size}`);
console.log(`Problematic (not in any source): ${missing.length}`);

console.log(`\n--- Key Takeaways ---`);
console.log(`- ${missing.length} of ${allComponents.size} components have no keyword in any source`);
console.log(`- These components show "..." in the UI instead of a keyword`);
console.log(`- Sources checked: kanji_main.json, component_keyword.json,`);
console.log(`  radicalsGroupedByStrokeCount, moreRadicalKeywords, radicalFalseFriends`);
console.log(`- Most missing are phonetic components; only ~${missing.filter(m => m.roles.includes("semantic") && !m.roles.includes("phonetic")).length} are semantic-only`);
console.log(`- Top impact: ${missing.slice(0, 5).map(m => `${m.component}(${m.count})`).join(", ")}`);

console.log(`\n--- Full Table ---\n`);
console.log("Component | Used as        | # kanji using it");
console.log("--------- | -------------- | ----------------");
for (const { component, roles, count } of missing) {
  const codePoint = [...component]
    .map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"))
    .join(" ");
  console.log(
    `${component}  (${codePoint})`.padEnd(22) +
      `| ${roles.padEnd(15)}| ${count}`
  );
}

console.log(`\n--- Plain list (${missing.length} components, copy-paste friendly) ---\n`);
console.log(missing.map((m) => m.component).join(" "));
