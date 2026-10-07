# Naming review: unnamed parts and radical names

Two lists for the user to decide on. Fill in the **Decision** column
(keep / rename to … / skip). Nothing here is applied yet. Once decided:

- Part names go in `raw-data/components/ours.json` (`"昜": { "k": "…" }`).
- Radical names go in `literalEn` in `raw-data/radicals/ours.json`.
- Then run `pnpm run generate-json`. The build fails if a name is already a
  kanji keyword or another component's keyword. Every suggestion below was
  checked against both on October 5, 2026.

"Kanji" counts how many kanji show the glyph in the Character Structure
accordion or the parts list, from all sources.

## Start here

**Radical names (section 2) are on hold.** They are now part of the radical
popover overhaul, item 2 in `docs/notes/radicals-pending.md`, which explains
why the names are being revisited and lists the candidate naming rules.
Don't apply section 2 until that is decided.

**Part names (section 1) don't depend on it.** Parts have no Japanese name or
radical popover, so their names are meanings either way.

## 1. Unnamed parts used by 5 or more kanji

These show "..." today. 28 glyphs, 23 shapes: some are the same part written
with different characters. For those, one name plus aliases for the other
spellings is enough — but only alias glyphs that are truly the same shape
(see "Decisions already made" in `radicals-pending.md`).

| Part         | Kanji | Examples          | Sound   | Suggested name   | Note                                                                 | Decision |
| ------------ | ----- | ----------------- | ------- | ---------------- | -------------------------------------------------------------------- | -------- |
| 昜           | 9     | 場 湯 陽 腸 傷 揚 | ヨウ    | sunbeams         | The sun with rays below it. "sunshine" is 陽, "rising sun" is 旭     |          |
| 𦍌           | 7     | 美 着 養 義 善 羨 |         | sheep top        | 羊 without its long tail, used on top                                |          |
| 丰           | 7     | 害 拝 邦 奉 封 峰 | ホウ    | luxuriant        | A plant growing thickly. In 害 and 拝 it's only the shape            |          |
| 𢦏           | 7     | 災 裁 栽 載 繊 戴 | サイ    | injure           | 十 + 戈. "wound" is 傷, "harm" is 害                                 |          |
| 尞           | 6     | 療 僚 寮 遼 瞭 燎 | リョウ  | bonfire          |                                                                      |          |
| 夋           | 6     | 酸 俊 駿 峻 竣 唆 | シュン  | slow walk        |                                                                      |          |
| 乚           | 6     | 礼 札 乱 乳 孔 也 |         | second hook      | A form of 乙 ("second"); dictionaries file these kanji under 乙      |          |
| 戔 / 㦮 / 戋 | 6     | 浅 残 銭 桟 践 箋 | セン    | thin slices      | The Anki deck glosses it "thinly sliced". Alias 㦮 and 戋 to 戔?     |          |
| 兑 / 兌      | 6     | 説 税 悦 脱 鋭 閲 | エツ, … | barter           | "exchange" is 換. Alias 兌 to 兑?                                    |          |
| 曷           | 6     | 喝 掲 渇 褐 謁 葛 | カツ    | why              | Its old meaning is "why, how"                                        |          |
| 圣           | 5     | 軽 径 経 怪 茎    | ケイ    | warp thread      | Japanese short form of 巠 (warp threads on a loom). "straight" is 直 |          |
| 兪 / 俞      | 5     | 輸 諭 癒 愉 喩    | ユ      | dugout canoe     | Alias 俞 to 兪?                                                      |          |
| 㐮 / 襄      | 5     | 譲 壌 醸 嬢 穣    | ジョウ  | lend a hand      | "assist" is 援, "help" is 助. Alias 襄 to 㐮?                        |          |
| 亼           | 5     | 今 合 命 令 余    |         | gathering lid    | A lid over things brought together                                   |          |
| 幵           | 5     | 形 研 開 刑 栞    |         | level            | Two even things side by side                                         |          |
| 翟           | 5     | 曜 濯 躍 耀 燿    |         | pheasant         |                                                                      |          |
| 𧘇           | 5     | 表 衣 裏 衷 褒    |         | garment bottom   | The lower half of 衣                                                 |          |
| 关           | 5     | 送 笑 関 咲 朕    |         | barrier          | Mostly just a shared shape here; the meaning fits only 関            |          |
| 夭           | 5     | 笑 妖 沃 喬 呑    | ヨウ    | bending person   | A person with the head tilted                                        |          |
| 雚           | 5     | 観 権 缶 勧 歓    | カン    | heron            |                                                                      |          |
| 僉           | 5     | 験 険 検 倹 剣    | ケン    | all together     |                                                                      |          |
| 夾           | 5     | 峡 挟 狭 頰 頬    | キョウ  | squeezed between | "put between" is 挟                                                  |          |
| 夌           | 5     | 陵 綾 凌 稜 崚    | リョウ  | surmount         |                                                                      |          |

Many of these are sound parts (昜 ヨウ, 尞 リョウ, 戔 セン, 曷 カツ…), which
overlaps with item 1A in `radicals-pending.md`.

## 1b. Temporary names (decided for now, revisit here)

| Part | Kanji          | Sound              | Name now | Was  | Note                                                                                                                                                                                              | Decision |
| ---- | -------------- | ------------------ | -------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 莫   | 暮 募 墓 幕 模 | も, ぼ, まく, ばく | sundown  | none | "none" looked like a missing name. Original meaning: the sun sinking into grass, the original form of 暮 "dusk" (Wiktionary). The later meaning "not / do not" is the alternative ("not" is free) |          |

## 2. Radical names that show on screen

`literalEn` is meant to be a literal translation of the Japanese name. Of the
245 entries, only these 107 ever showed. (Since then the unused entries were
deleted and some names moved to the drawer's glyphs, e.g. 丨's "vertical
stick" now lives on ｜; what users see is the same.)

- In a kanji breakdown (Character Structure, parts list) and its popover.
- Or, for "drawer only", as the keyword of a radical picked in the radical
  search drawer.

The other 138 never show:

- 117 radicals are kanji, so the kanji keyword is shown instead.
- 13 are only reached through an alternate form that now shows the kanji
  keyword: 言 (訁), 肉 (⺼), 食 (飠 𩙿), 足 (𧾷), 戸 (戶), 牛 (⺧ 牜), 黒
  (黑), 西 (覀), 風 (𠘨), 歯 (齒), 糸 (糹), 亀 (龜), 羊 (⺶).
- 7 are spellings used by no kanji and not in the drawer: ⺝ ⺇ ⺪ ⽹ ⾋ ⻟ ⼊.
- 邑 stopped showing when 阝 became a plain part ("hill or village").

Glyphs in brackets are the other shapes that show the same name. Kept on
purpose (don't reopen): 丿/ノ "katakana no", 厶 "katakana mu", 乙/⺃ "second".

| Glyph         | Shown on    | Japanese name  | English now         | Note                                                                                                             | Decision |
| ------------- | ----------- | -------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| 囗            | 210 kanji   | くにがまえ     | country enclosure   |                                                                                                                  |          |
| 丶            | 188 kanji   | てん           | dot                 |                                                                                                                  |          |
| ⺡ (氵)       | 133 kanji   | さんずい       | three water         |                                                                                                                  |          |
| 丨 (｜)       | 115 kanji   | たてぼう       | vertical stick      |                                                                                                                  |          |
| ⺅ (亻)       | 110 kanji   | にんべん       | person left         |                                                                                                                  |          |
| 廾            | 98 kanji    | にじゅうあし   | twenty legs         |                                                                                                                  |          |
| ⺘ (扌)       | 94 kanji    | てへん         | hand left           |                                                                                                                  |          |
| 丿 (ノ)       | 81 kanji    | の             | katakana no         |                                                                                                                  |          |
| 艹 (⺾ 艸 䒑) | 79 kanji    | くさかんむり   | grass crown         |                                                                                                                  |          |
| ⻌ (辶 辵 辶) | 59 kanji    | しんにょう     | movement wrap       |                                                                                                                  |          |
| 宀            | 55 kanji    | うかんむり     | u crown             | Renamed to "katakana u crown" (shaped like ウ); may change in the popover overhaul                               |          |
| 儿            | 51 kanji    | ひとあし       | person legs         |                                                                                                                  |          |
| 冂            | 51 kanji    | けいがまえ     | border enclosure    | Decided: keep the meaning (the Japanese name is just its reading)                                                |          |
| 亠            | 50 kanji    | なべぶた       | pot lid             |                                                                                                                  |          |
| 冖            | 47 kanji    | わかんむり     | wa crown            | Renamed to "katakana wa crown" (shaped like ワ); may change in the popover overhaul                              |          |
| 隹            | 40 kanji    | ふるとり       | old bird            |                                                                                                                  |          |
| 勹            | 39 kanji    | つつみがまえ   | wrap enclosure      |                                                                                                                  |          |
| 禾            | 38 kanji    | のぎへん       | grain left          |                                                                                                                  |          |
| 攵 (攴)       | 38 kanji    | ぼくづくり     | strike right        |                                                                                                                  |          |
| ⺖ (忄)       | 38 kanji    | りっしんべん   | standing heart left |                                                                                                                  |          |
| 厶            | 36 kanji    | む             | katakana mu         |                                                                                                                  |          |
| 戈            | 35 kanji    | ほこ           | dagger-axe          | Decided October 2026                                                                                             |          |
| ⺉ (刂)       | 33 kanji    | りっとう       | standing sword      |                                                                                                                  |          |
| 夂            | 33 kanji    | のまた         | katakana no + again | Decided October 2026: のまた = katakana ノ + 又 (again)                                                          |          |
| 冫            | 32 kanji    | にすい         | two water           |                                                                                                                  |          |
| 尸            | 32 kanji    | しかばね       | corpse              |                                                                                                                  |          |
| 厂            | 32 kanji    | がんだれ       | cliff hanging       |                                                                                                                  |          |
| 頁            | 31 kanji    | おおがい       | big shell           |                                                                                                                  |          |
| ⻖            | 31 kanji    | こざとへん     | small village left  | Decided October 2026                                                                                             |          |
| 彐 (彑 ヨ ⺕) | 30 kanji    | けいがしら     | pig head            |                                                                                                                  |          |
| ⺮            | 29 kanji    | たけかんむり   | bamboo crown        |                                                                                                                  |          |
| 亅            | 28 kanji    | はねぼう       | hook stick          | Decided: keep the meaning (the Japanese name is just its reading)                                                |          |
| ⺣ (灬)       | 27 kanji    | れっか         | lined fire          |                                                                                                                  |          |
| 广            | 26 kanji    | まだれ         | ma hanging          | Renamed to "hemp hanging" (ま is from 麻); may change in the popover overhaul. Leaning: "slanting roof hanging"? |          |
| 卩 (㔾)       | 24 kanji    | ふしづくり     | seal right          | Renamed to "joint right"                                                                                         |          |
| 艮            | 22 kanji    | こん           | stopping            | Decided October 2026                                                                                             |          |
| 彳            | 21 kanji    | ぎょうにんべん | going person left   |                                                                                                                  |          |
| 罒 (网 ⺲)    | 21 kanji    | あみがしら     | net head            |                                                                                                                  |          |
| 几            | 21 kanji    | きにょう       | table wrap          |                                                                                                                  |          |
| ⺩ (𤣩)       | 20 kanji    | おうへん       | king left           |                                                                                                                  |          |
| 彡            | 17 kanji    | さんづくり     | bristle right       | Decided: keep the meaning (the Japanese name is just its reading)                                                |          |
| 殳            | 17 kanji    | るまた         | katakana ru + again | Decided October 2026: るまた = katakana ル + 又 (again)                                                          |          |
| 匕            | 16 kanji    | さじ           | spoon               |                                                                                                                  |          |
| 幺            | 16 kanji    | いとがしら     | thread head         | Decided October 2026                                                                                             |          |
| ⺌ (⺍)       | 16 kanji    | しょうかんむり | small crown         |                                                                                                                  |          |
| ⺭ (礻)       | 15 kanji    | しめすへん     | show left           |                                                                                                                  |          |
| 疒            | 15 kanji    | やまいだれ     | sickness hanging    |                                                                                                                  |          |
| ⺨ (犭)       | 15 kanji    | けものへん     | beast left          |                                                                                                                  |          |
| 凵            | 14 kanji    | かんにょう     | open box wrap       | Decided: keep the meaning (the Japanese name is just its reading)                                                |          |
| 豕            | 14 kanji    | いのこ         | wild pig            | Decided October 2026                                                                                             |          |
| ⻏            | 14 kanji    | おおざと       | large village       |                                                                                                                  |          |
| ⻗            | 13 kanji    | あめかんむり   | rain crown          |                                                                                                                  |          |
| ⺤ (爫)       | 13 kanji    | つめかんむり   | claw crown          |                                                                                                                  |          |
| 卜 (⺊)       | 12 kanji    | ぼく           | divination          |                                                                                                                  |          |
| 𠆢            | 12 kanji    | ひとやね       | person roof         |                                                                                                                  |          |
| 氺            | 11 kanji    | したみず       | bottom water        |                                                                                                                  |          |
| 𠂉            | 11 kanji    | のいち         | no plus one         |                                                                                                                  |          |
| 匚            | 10 kanji    | はこがまえ     | box enclosure       |                                                                                                                  |          |
| 聿            | 8 kanji     | ふでづくり     | brush right         |                                                                                                                  |          |
| 虍            | 8 kanji     | とらがしら     | tiger head          |                                                                                                                  |          |
| 疋            | 8 kanji     | ひき           | bolt of cloth       |                                                                                                                  |          |
| 巛            | 8 kanji     | まがりがわ     | bent river          |                                                                                                                  |          |
| 丷            | 8 kanji     | はちがしら     | eight head          |                                                                                                                  |          |
| 曰            | 8 kanji     | ひらび         | flat sun            |                                                                                                                  |          |
| 歹            | 6 kanji     | がつ           | bare bone           | Decided October 2026                                                                                             |          |
| 韋            | 6 kanji     | なめしがわ     | tanned leather      |                                                                                                                  |          |
| 舛            | 6 kanji     | まいあし       | dancing legs        |                                                                                                                  |          |
| 耂 (⺹)       | 5 kanji     | おいかんむり   | old crown           |                                                                                                                  |          |
| 弋            | 5 kanji     | いぐるみ       | javelin             | Renamed to "corded arrow"                                                                                        |          |
| 匸            | 5 kanji     | かくしがまえ   | hide enclosure      |                                                                                                                  |          |
| 爿 (丬)       | 5 kanji     | しょうへん     | split wood left     | Decided: keep the meaning (the Japanese name is just its reading)                                                |          |
| ⻊            | 5 kanji     | あしへん       | foot left           |                                                                                                                  |          |
| 毋            | 4 kanji     | なかれ         | do not              |                                                                                                                  |          |
| 廴            | 4 kanji     | えんにょう     | stretch wrap        |                                                                                                                  |          |
| 隶            | 4 kanji     | れいづくり     | capture right       | Renamed to "servant right"                                                                                       |          |
| 尢 (尤)       | 4 kanji     | だいのまげあし | big bent legs       |                                                                                                                  |          |
| 而            | 4 kanji     | しこうして     | and then            |                                                                                                                  |          |
| 癶            | 3 kanji     | はつがしら     | departure head      |                                                                                                                  |          |
| 耒            | 3 kanji     | らいすき       | plow                |                                                                                                                  |          |
| 屮            | 3 kanji     | くさのめ       | grass sprout        |                                                                                                                  |          |
| 豸            | 3 kanji     | むじなへん     | badger left         |                                                                                                                  |          |
| マ            | 3 kanji     | ま             | katakana ma         |                                                                                                                  |          |
| 八 (ハ)       | 3 kanji     | はち           | eight               |                                                                                                                  |          |
| 气            | 2 kanji     | きがまえ       | steam enclosure     |                                                                                                                  |          |
| 釆            | 2 kanji     | のごめ         | katakana no + rice  | Decided October 2026: の = katakana ノ (shape), ごめ = 米 rice                                                   |          |
| 瓜            | 2 kanji     | うり           | melon               |                                                                                                                  |          |
| 齊            | 2 kanji     | せい           | even                | Decided: keep the meaning (the Japanese name is just its reading)                                                |          |
| ⺗            | 2 kanji     | したごころ     | bottom heart        |                                                                                                                  |          |
| 鬲            | 2 kanji     | れき           | tripod kettle       | Decided October 2026                                                                                             |          |
| 爻            | 2 kanji     | こう           | intersecting lines  | Decided October 2026                                                                                             |          |
| 无 (旡)       | 1 kanji     | むにょう       | nothing wrap        |                                                                                                                  |          |
| 夊            | 1 kanji     | なつあし       | summer legs         |                                                                                                                  |          |
| 已            | 1 kanji     | おのれ         | oneself             |                                                                                                                  |          |
| ユ            | 1 kanji     | ゆ             | katakana yu         |                                                                                                                  |          |
| 髟            | 1 kanji     | かみかんむり   | hair crown          |                                                                                                                  |          |
| 鬯            | 1 kanji     | においざけ     | fragrant wine       |                                                                                                                  |          |
| 禸            | 1 kanji     | じゅうのあし   | beast's feet        |                                                                                                                  |          |
| 黍            | 1 kanji     | きび           | millet              |                                                                                                                  |          |
| ⻂            | drawer only | ころもへん     | clothing left       |                                                                                                                  |          |
| 韭            | drawer only | にら           | leek                |                                                                                                                  |          |
| 鬥            | drawer only | たたかいがまえ | fight enclosure     |                                                                                                                  |          |
| 鹵            | drawer only | しお           | chemical salt       | Decided October 2026                                                                                             |          |
| 黹            | drawer only | ぬいとり       | embroidery          |                                                                                                                  |          |
| 黽            | drawer only | かえる         | frog                |                                                                                                                  |          |
| 鼎            | drawer only | かなえ         | tripod              |                                                                                                                  |          |
| 鼠            | drawer only | ねずみ         | rat                 |                                                                                                                  |          |
| 龠            | drawer only | やく           | pan flute           | Decided October 2026                                                                                             |          |
