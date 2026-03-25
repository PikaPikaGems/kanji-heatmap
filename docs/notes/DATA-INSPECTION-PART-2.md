# Data Inspection Part 2: kanjidict.txt Analysis

Source: https://github.com/mifunetoshiro/kanjium/blob/master/data/source_files/kanjidict.txt

## Overview

- **6,813 rows**, tab-separated, **no header row**
- All rows have exactly **24 columns**
- More comprehensive than `kanji-structure.json` (2,474 entries) — covers ~2.8x more kanji

## Column Structure

| Col | Field                     | Example (握)                           | Fill Rate    |
| --- | ------------------------- | -------------------------------------- | ------------ |
| 1   | Kanji                     | 握                                     | 100% (6,813) |
| 2   | Radical (original form)   | 手                                     | 100% (6,813) |
| 3   | Radical variant           | 扌                                     | 38% (2,614)  |
| 4   | Phonetic component        | 屋                                     | 23% (1,553)  |
| 5   | IDS structure             | ⿰                                     | 100% (6,813) |
| 6   | Structure type            | Phono-semantic compound                | 44% (2,992)  |
| 7   | On'yomi (common)          | アク                                   | most         |
| 8   | Kun'yomi (common)         | にぎ（る）                             | many         |
| 9   | On'yomi (detailed+origin) | アク(呉)                               | most         |
| 10  | Kun'yomi (extended)       | にぎ（る）                             | many         |
| 11  | Nanori (name readings)    | もち                                   | some         |
| 12  | Stroke count              | 12                                     | most         |
| 13  | Grade/Classification      | Jōyō (1st grade of junior high school) | most         |
| 14  | JLPT level                | N1 (advanced)                          | Jōyō only    |
| 15  | Kanken level              | 4                                      | most         |
| 16  | Frequency rank            | 959                                    | ~50%         |
| 17  | English meanings (full)   | grip;hold;mould sushi;bribe;grasp      | most         |
| 18  | English meanings (short)  | grip;grasp                             | most         |
| 19  | Dictionary ref 1          | 1059                                   | sparse       |
| 20  | Dictionary ref 2          | 1139                                   | sparse       |
| 21  | Dictionary ref 3          | 1415                                   | sparse       |
| 22  | Dictionary ref 4          | 1308                                   | sparse       |
| 23  | Dictionary ref 5          | 1370                                   | sparse       |
| 24  | Dictionary ref 6          | 42                                     | sparse       |

## Structure Types (Column 6)

| Count | Type                       | Japanese Term  |
| ----- | -------------------------- | -------------- |
| 3,821 | _(empty — not classified)_ | —              |
| 1,354 | Compound ideograph         | 会意 (kaii)    |
| 1,321 | Phono-semantic compound    | 形声 (keisei)  |
| 250   | Pictograph                 | 象形 (shoukei) |
| 67    | Ideograph                  | 指事 (shiji)   |

### Comparison with kanji-structure.json types

| kanji-structure.json | Count | kanjidict.txt equivalent |
| -------------------- | ----- | ------------------------ |
| keisei               | 1,388 | Phono-semantic compound  |
| kaii                 | 351   | Compound ideograph       |
| shoukei              | 230   | Pictograph               |
| shiji                | 23    | Ideograph                |
| unknown              | 448   | _(empty)_                |
| shinjitai            | 20    | _(no equivalent)_        |
| kokuji               | 9     | _(no equivalent)_        |
| derivative           | 3     | _(no equivalent)_        |
| rebus                | 2     | _(no equivalent)_        |

Note: kanjidict.txt does NOT have shinjitai, kokuji, derivative, or rebus types.

## IDS Structure Indicators (Column 5)

| Count | Symbol | Meaning               |
| ----- | ------ | --------------------- |
| 1,978 | ⿰     | Left-right            |
| 1,127 | 品l    | 3-part (left heavy?)  |
| 844   | ⿱     | Top-bottom            |
| 348   | ⿳     | Top-middle-bottom     |
| 332   | ⿲     | Left-middle-right     |
| 327   | 囗     | Enclosure             |
| 325   | ⿰4    | Left-right variant    |
| 280   | 品u    | 3-part (top heavy?)   |
| 251   | ⿸     | Surround upper-left   |
| 244   | 品     | 3-part                |
| 179   | ⿺     | Surround lower-left   |
| 153   | 品r    | 3-part (right heavy?) |
| 76    | ⿵     | Surround top          |
| 74    | ⿰2    | Left-right variant    |
| 74    | ⿰1    | Left-right variant    |
| 53    | ⿰5    | Left-right variant    |
| 46    | ⿹     | Surround upper-right  |
| 40    | ⿴     | Full surround         |
| 27    | ⿱1    | Top-bottom variant    |
| 19    | ⿰3    | Left-right variant    |

The numbered variants (⿰1, ⿰2, etc.) and 品l/品u/品r are non-standard — likely kanjium-specific annotations for sub-layouts.

## Component Analysis

### Column 3 (Radical Variant)

Filled for 2,614/6,813 entries (38%). This is the visual form of the radical as it appears
in the kanji (e.g., 手→扌, 水→氵, 人→亻). Empty when the radical appears in its original form.

### Column 4 (Phonetic Component)

Filled for 1,553/6,813 entries (23%). Both columns filled: 670 entries.

**Key observations:**

- All values are single characters (no multi-char components)
- For **Phono-semantic compounds**: 1,231/1,321 have col4 filled (93%). 90 are missing.
- For **Compound ideographs**: 219/1,354 have col4 filled — but in 208 cases, col4 = the kanji itself
  (self-referential, meaning the kanji IS a phonetic element used by other kanji)

### Can we reliably get semantic + phonetic?

**Phono-semantic compounds: YES (mostly)**

- Semantic = column 2 (radical original form), with variant in column 3
- Phonetic = column 4
- 90 entries (~7%) are missing the phonetic — data quality gap

**Compound ideographs: PARTIAL**

- Only the primary radical (col 2) is listed
- Other semantic components are NOT explicitly listed
- Column 4, when filled, is usually self-referential (the kanji itself)
- 11 exceptions where col4 ≠ kanji: 菊→匊, 孝→耂, 考→耂, 柵→冊, 殺→杀, 仁→二, 龍→立, 佛→弗, 刹→杀, 拂→弗, 沸→弗

### Are there kanji with 2+ semantic components?

**Yes — compound ideographs by definition combine multiple semantic elements**
(e.g., 安 = 宀 + 女, 悪 = 亜 + 心, 明 = 日 + 月).

However, kanjidict.txt only lists the **primary radical** in column 2.
The other semantic components are NOT broken out. You would need a separate
decomposition source (like kanji-structural-hlorenzi.json or KANJIDIC2) to get all components.

## Data kanjidict.txt has that we DON'T currently use

| Data                        | Column | Notes                                      |
| --------------------------- | ------ | ------------------------------------------ |
| On'yomi origin (漢/呉/慣用) | 9      | Historical Chinese pronunciation layer     |
| Nanori (name readings)      | 11     | Used in personal/place names               |
| Kanken level                | 15     | Kanji Kentei exam level                    |
| Radical (original form)     | 2      | We use component_keyword.json instead      |
| Radical variant             | 3      | Maps to radicalFalseFriends in radicals.ts |
| IDS structure               | 5      | Visual layout of the kanji                 |

## UI Display Suggestions

```
┌─────────────────────────────────────────┐
│  Structure: Phono-semantic compound  ⿰  │
│                                         │
│  ┌──────────┐    ┌──────────┐           │
│  │    扌     │    │    屋    │           │
│  │ semantic  │    │ phonetic │           │
│  │  (hand)   │    │  (roof)  │           │
│  └──────────┘    └──────────┘           │
│                                         │
│  Radical: 手 (hand) — 4 strokes         │
└─────────────────────────────────────────┘
```

## Recommendations

### 1. Use kanjidict.txt as primary source for structure type

kanjidict.txt covers 2,992 kanji with structure types vs 2,474 in kanji-structure.json.
However, kanjidict.txt lacks shinjitai/kokuji/derivative/rebus types — consider merging.

### 2. Use kanjidict.txt semantic/phonetic for phono-semantic compounds

93% have both semantic and phonetic explicitly listed. Compare with kanji-structure.json
to find disagreements (validation script does this).

### 3. Don't rely on kanjidict.txt for compound ideograph decomposition

Only the primary radical is listed. Keep using kanji-structure.json or hlorenzi data
for full component breakdowns.

### 4. Consider adding to UI

- **Reading origins** (呉音/漢音) — small badge next to each on'yomi
- **Kanken level** — badge in classification row
- **IDS structure indicator** — visual hint for kanji composition layout

## Sample Rows

```
握  手  扌  屋  ⿰  Phono-semantic compound  アク  にぎ（る）  アク(呉)  にぎ（る）  もち  12  Jōyō  N1  4  959  grip;hold;...  grip;grasp  1059  1139  1415  1308  1370  42
悪  心          ⿱  Compound ideograph      アク、オ  わる（い）  アク(呉)、オ(漢)、ウ(呉)  ...  11  Kyōiku-Jōyō  N4  8  307  bad;vice;...  bad  1810  1951  220  220  175  12
旭  日          ⿺  (empty)                          キョク(漢)、コク(呉)  あさひ  ...  6  Jinmeiyō       pre-1  2034  rising sun...     27  27
```
