# Overlaps between `component_keyword.json` and `radical.ts` (first run)

```
(base) ➜  kanji-heatmap git:(mar24-2026) ✗ npm run find-unhandled-components

> kanji-heatmap@0.0.0 find-unhandled-components
> node scripts/find-unhandled-components.mjs

============================================================
UNHANDLED COMPONENTS REPORT
component_keyword.json entries NOT in radicals.ts
============================================================

--- Stats ---
Total in component_keyword.json: 96
Handled in radicals.ts: 70
  - in radicalsGroupedByStrokeCount: 57
  - in moreRadicalKeywords: 0
  - in radicalFalseFriends (as key): 13
  - in radicalFalseFriends (as value): 0
NOT handled in radicals.ts: 26
  - of which also in kanji_main.json: 0

--- Key Takeaways ---
- 26 components in component_keyword.json have no entry in radicals.ts
- 0 of these are also full kanji (in kanji_main.json), so they
  are reachable via kanji lookup but not via radical search
- The remaining 26 are neither kanji nor radicals — they
  only exist in component_keyword.json

--- Full Table ---

Component | Keyword              | Also in kanji_main?
--------- | -------------------- | -------------------
兀  (U+5140)           | towering             | no
壬  (U+58EC)           | 9th in rank          | no
氺  (U+6C3A)           | water splash         | no
乍  (U+4E4D)           | while                | no
衤  (U+8864)           | clothes on mannequin | no
夬  (U+592C)           | certain              | no
洛  (U+6D1B)           | old Kyoto            | no
吊  (U+540A)           | dangle               | no
昏  (U+660F)           | dusk                 | no
兔  (U+5154)           | hare                 | no
巷  (U+5DF7)           | alley                | no
飠  (U+98E0)           | eat less             | no
廿  (U+5EFF)           | twenty               | no
匸  (U+5338)           | hiding enclosure     | no
于  (U+4E8E)           | out of               | no
尹  (U+5C39)           | official rank        | no
旡  (U+65E1)           | choke                | no
乂  (U+4E42)           | regulate             | no
莫  (U+83AB)           | shalt                | no
阝  (U+961D)           | mound (left) / town (right)| no
屏  (U+5C4F)           | folding screen       | no
㑒  (U+3452)           | consensus            | no
ヨ冖又  (U+30E8 U+5196 U+53C8)| resting cat          | no
𠦝  (U+2099D)         | thin car             | no
矢隹  (U+77E2 U+96B9)   | yakitori             | no
咅  (U+5485)           | spit out             | no

--- Plain list (26 components, copy-paste friendly) ---

兀 壬 氺 乍 衤 夬 洛 吊 昏 兔 巷 飠 廿 匸 于 尹 旡 乂 莫 阝 屏 㑒 ヨ冖又 𠦝 矢隹 咅
```

# `kanji-structure.json`

Updating

```
1.  艸 -> 艹
2.  ⽊ (radical) -> 木 (kanji)
```

Weird Stuff

```
https://kanjiheatmap.com/?open=円

Why is it?

囗
Semantic
員
phonetic

https://kanjiheatmap.com/?open=考

```

See also: https://github.com/PikaPikaGems/kanji-heatmap-data/issues/5

# Finding Missing Kanji

```
(base) ➜ kanji-heatmap git:(mar24-2026) ✗ npm run find-missing-components

> kanji-heatmap@0.0.0 find-missing-components
> node scripts/find-missing-components.mjs


============================================================
FIND MISSING COMPONENTS REPORT
============================================================

--- Stats ---
Total unique semantic components: 142
Total unique phonetic components: 589
Total unique components (union): 677
Problematic (not in any source): 157

--- Key Takeaways ---

- 157 of 677 components have no keyword in any source
- These components show "..." in the UI instead of a keyword
- Sources checked: kanji_main.json, component_keyword.json,
  radicalsGroupedByStrokeCount, moreRadicalKeywords, radicalFalseFriends
- Most missing are phonetic components; only ~13 are semantic-only
- Top impact: 辵(43), 攴(12), 网(6), 昜(6), 戔(6)

--- Full Table ---

| Component    | Used as           | # kanji using it |
| ------------ | ----------------- | ---------------- |
| 辵 (U+8FB5)  | semantic          | 43               |
| 攴 (U+6534)  | semantic          | 12               |
| 网 (U+7F51)  | semantic          | 6                |
| 昜 (U+661C)  | phonetic          | 6                |
| 戔 (U+6214)  | phonetic          | 6                |
| 兑 (U+5151)  | phonetic          | 6                |
| 𢦏 (U+2298F) | phonetic          | 6                |
| 曷 (U+66F7)  | phonetic          | 6                |
| 圣 (U+5723)  | phonetic          | 5                |
| 雚 (U+96DA)  | phonetic          | 5                |
| 兪 (U+516A)  | phonetic          | 5                |
| 尞 (U+5C1E)  | phonetic          | 5                |
| 甬 (U+752C)  | phonetic          | 4                |
| 袁 (U+8881)  | phonetic          | 4                |
| 枼 (U+67BC)  | phonetic          | 4                |
| 畐 (U+7550)  | phonetic          | 4                |
| 氐 (U+6C10)  | phonetic          | 4                |
| 尃 (U+5C03)  | phonetic          | 4                |
| 弗 (U+5F17)  | phonetic          | 4                |
| 蜀 (U+8700)  | phonetic          | 4                |
| 朿 (U+673F)  | phonetic          | 4                |
| 复 (U+590D)  | phonetic          | 4                |
| 咼 (U+54BC)  | phonetic          | 4                |
| 冓 (U+5193)  | phonetic          | 4                |
| 夋 (U+590B)  | phonetic          | 4                |
| 爰 (U+7230)  | phonetic          | 4                |
| 喿 (U+55BF)  | phonetic          | 4                |
| 丰 (U+4E30)  | phonetic          | 4                |
| 夾 (U+593E)  | phonetic          | 4                |
| 禺 (U+79BA)  | phonetic          | 4                |
| 臤 (U+81E4)  | phonetic          | 4                |
| 䍃 (U+4343)  | phonetic          | 4                |
| 㐮 (U+342E)  | phonetic          | 4                |
| 辟 (U+8F9F)  | phonetic          | 4                |
| 𡈼 (U+2123C) | semantic+phonetic | 3                |
| 丂 (U+4E02)  | phonetic          | 3                |
| 㕣 (U+3563)  | phonetic          | 3                |
| 翟 (U+7FDF)  | phonetic          | 3                |
| 关 (U+5173)  | phonetic          | 3                |
| 奐 (U+5950)  | phonetic          | 3                |
| 𦰩 (U+26C29) | phonetic          | 3                |
| 彔 (U+5F54)  | phonetic          | 3                |
| 埶 (U+57F6)  | phonetic          | 3                |
| 劦 (U+52A6)  | phonetic          | 3                |
| 𤇾 (U+241FE) | phonetic          | 3                |
| 亢 (U+4EA2)  | phonetic          | 3                |
| 侖 (U+4F96)  | phonetic          | 3                |
| 攸 (U+6538)  | phonetic          | 3                |
| 龹 (U+9FB9)  | phonetic          | 3                |
| 悤 (U+60A4)  | phonetic          | 3                |
| 扁 (U+6241)  | phonetic          | 3                |
| 戠 (U+6220)  | phonetic          | 3                |
| 蒦 (U+84A6)  | phonetic          | 3                |
| 耑 (U+8011)  | phonetic          | 3                |
| 堇 (U+5807)  | phonetic          | 3                |
| 茲 (U+8332)  | phonetic          | 3                |
| 并 (U+5E76)  | phonetic          | 3                |
| 夆 (U+5906)  | phonetic          | 3                |
| 夌 (U+590C)  | phonetic          | 3                |
| 賁 (U+8CC1)  | phonetic          | 3                |
| 敝 (U+655D)  | phonetic          | 3                |
| 㫃 (U+3AC3)  | semantic          | 2                |
| 戊 (U+620A)  | semantic+phonetic | 2                |
| 开 (U+5F00)  | phonetic          | 2                |
| 𠂔 (U+20094) | phonetic          | 2                |
| 囟 (U+56DF)  | phonetic          | 2                |
| 㐬 (U+342C)  | phonetic          | 2                |
| 罙 (U+7F59)  | phonetic          | 2                |
| 咸 (U+54B8)  | phonetic          | 2                |
| 柬 (U+67EC)  | phonetic          | 2                |
| 睪 (U+776A)  | phonetic          | 2                |
| 䜌 (U+470C)  | phonetic          | 2                |
| 坴 (U+5774)  | phonetic          | 2                |
| 㒸 (U+34B8)  | phonetic          | 2                |
| 厤 (U+53A4)  | phonetic          | 2                |
| 竟 (U+7ADF)  | phonetic          | 2                |
| 叚 (U+53DA)  | phonetic          | 2                |
| 朮 (U+672E)  | phonetic          | 2                |
| 隺 (U+96BA)  | phonetic          | 2                |
| 乇 (U+4E47)  | phonetic          | 2                |
| 宓 (U+5B93)  | phonetic          | 2                |
| 𡿺 (U+21FFA) | phonetic          | 2                |
| 豦 (U+8C66)  | phonetic          | 2                |
| 孰 (U+5B70)  | phonetic          | 2                |
| 奞 (U+595E)  | phonetic          | 2                |
| 卬 (U+536C)  | phonetic          | 2                |
| 丩 (U+4E29)  | phonetic          | 2                |
| 犮 (U+72AE)  | phonetic          | 2                |
| 冘 (U+5198)  | phonetic          | 2                |
| 尗 (U+5C17)  | phonetic          | 2                |
| 㐱 (U+3431)  | phonetic          | 2                |
| 妟 (U+599F)  | phonetic          | 2                |
| 叟 (U+53DF)  | phonetic          | 2                |
| 厓 (U+5393)  | phonetic          | 2                |
| 奚 (U+595A)  | phonetic          | 2                |
| 畾 (U+757E)  | phonetic          | 2                |
| 荅 (U+8345)  | phonetic          | 2                |
| 犀 (U+7280)  | phonetic          | 2                |
| 迶 (U+8FF6)  | phonetic          | 2                |
| 菐 (U+83D0)  | phonetic          | 2                |
| 曼 (U+66FC)  | phonetic          | 2                |
| 桼 (U+687C)  | phonetic          | 2                |
| 褱 (U+8931)  | phonetic          | 2                |
| 睘 (U+7758)  | phonetic          | 2                |
| 熏 (U+718F)  | phonetic          | 2                |
| 豤 (U+8C64)  | phonetic          | 2                |
| 溥 (U+6EA5)  | phonetic          | 2                |
| 剌 (U+524C)  | phonetic          | 2                |
| 离 (U+79BB)  | phonetic          | 2                |
| 咢 (U+54A2)  | phonetic          | 2                |
| 夭 (U+592D)  | phonetic          | 2                |
| 夗 (U+5917)  | phonetic          | 2                |
| 齒 (U+9F52)  | semantic          | 1                |
| 敕 (U+6555)  | semantic          | 1                |
| 爭 (U+722D)  | semantic          | 1                |
| 黑 (U+9ED1)  | semantic          | 1                |
| 庚 (U+5E9A)  | semantic          | 1                |
| 襾 (U+897E)  | semantic          | 1                |
| 柰 (U+67F0)  | semantic          | 1                |
| 帛 (U+5E1B)  | semantic          | 1                |
| 壴 (U+58F4)  | semantic          | 1                |
| 哥 (U+54E5)  | phonetic          | 1                |
| 亲 (U+4EB2)  | phonetic          | 1                |
| 𠬝 (U+20B1D) | phonetic          | 1                |
| 羕 (U+7F95)  | phonetic          | 1                |
| 㒼 (U+34BC)  | phonetic          | 1                |
| 宁 (U+5B81)  | phonetic          | 1                |
| 羍 (U+7F8D)  | phonetic          | 1                |
| 賈 (U+8CC8)  | phonetic          | 1                |
| 屰 (U+5C70)  | phonetic          | 1                |
| 妾 (U+59BE)  | phonetic          | 1                |
| 敄 (U+6544)  | phonetic          | 1                |
| 絜 (U+7D5C)  | phonetic          | 1                |
| 夅 (U+5905)  | phonetic          | 1                |
| 肙 (U+8099)  | phonetic          | 1                |
| 烝 (U+70DD)  | phonetic          | 1                |
| 臧 (U+81E7)  | phonetic          | 1                |
| 卂 (U+5342)  | phonetic          | 1                |
| 倝 (U+501D)  | phonetic          | 1                |
| 卦 (U+5366)  | phonetic          | 1                |
| 它 (U+5B83)  | phonetic          | 1                |
| 陏 (U+964F)  | phonetic          | 1                |
| 胥 (U+80E5)  | phonetic          | 1                |
| 厷 (U+53B7)  | phonetic          | 1                |
| 崔 (U+5D14)  | phonetic          | 1                |
| 窄 (U+7A84)  | phonetic          | 1                |
| 垔 (U+5794)  | phonetic          | 1                |
| 罔 (U+7F54)  | phonetic          | 1                |
| 閏 (U+958F)  | phonetic          | 1                |
| 楚 (U+695A)  | phonetic          | 1                |
| 蚤 (U+86A4)  | phonetic          | 1                |
| 潘 (U+6F58)  | phonetic          | 1                |
| 彭 (U+5F6D)  | phonetic          | 1                |
| 羔 (U+7F94)  | phonetic          | 1                |
| 滕 (U+6ED5)  | phonetic          | 1                |
| 匽 (U+533D)  | phonetic          | 1                |
| 戕 (U+6215)  | phonetic          | 1                |

--- Plain list (157 components, copy-paste friendly) ---

辵 攴 网 昜 戔 兑 𢦏 曷 圣 雚 兪 尞 甬 袁 枼 畐 氐 尃 弗 蜀 朿 复 咼 冓 夋 爰 喿 丰 夾 禺 臤 䍃 㐮 辟 𡈼 丂 㕣 翟 关 奐 𦰩 彔 埶 劦 𤇾 亢 侖 攸 龹 悤 扁 戠 蒦 耑 堇 茲 并 夆 夌 賁 敝 㫃 戊 开 𠂔 囟 㐬 罙 咸 柬 睪 䜌 坴 㒸 厤 竟 叚 朮 隺 乇 宓 𡿺 豦 孰 奞 卬 丩 犮 冘 尗 㐱 妟 叟 厓 奚 畾 荅 犀 迶 菐 曼 桼 褱 睘 熏 豤 溥 剌 离 咢 夭 夗 齒 敕 爭 黑 庚 襾 柰 帛 壴 哥 亲 𠬝 羕 㒼 宁 羍 賈 屰 妾 敄 絜 夅 肙 烝 臧 卂 倝 卦 它 陏 胥 厷 崔 窄 垔 罔 閏 楚 蚤 潘 彭 羔 滕 匽 戕
```

# Sources

- https://github.com/mifunetoshiro/kanjium/blob/master/data/source_files/kanjidict.txt
- https://raw.githubusercontent.com/hlorenzi/jisho-open/main/backend/src/data/kanji_structural_category.ts
- https://github.com/rewhowe/kanji/tree/develop
