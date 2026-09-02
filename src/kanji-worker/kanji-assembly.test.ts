import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { VocabExtendedInfo } from "@/lib/kanji/kanji-info-types";
import {
  ComponentsMap,
  GeneralInfoResponseType,
  HoverInfoResponseType,
  KanjiMainInfo,
  MainKanjiInfoResponseType,
  VocabResponseType,
} from "@/lib/kanji/kanji-worker-types";
import { decodeFurigana } from "@/lib/furigana";
import {
  transformToGeneralKanjiInfo,
  transformToHoverKanjiInfo,
  transformToMainKanjiInfo,
} from "./helpers";
import {
  extractKanjiGeneralData,
  extractKanjiHoverData,
} from "./kanji-assembly";

// Characterization tests: pin the EXACT hover/"general" payloads produced from
// the real production JSON. These snapshots were first recorded while the
// assembly still ran on the main thread against the v1 files, so they are what
// proves that moving the logic into the worker and regenerating the data did
// not change a single field consumers read.

const readV2 = <T>(name: string): T =>
  JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public/json/v2", name), "utf8")
  ) as T;

const rawMain = readV2<MainKanjiInfoResponseType>("kanji_main.json");
const rawGeneral = readV2<GeneralInfoResponseType>(
  "kanji_extended_general.json"
);
const rawHover = readV2<HoverInfoResponseType>("kanji_extended_hover.json");
const components = readV2<ComponentsMap>("components.json");
const rawVocab = readV2<VocabResponseType>("vocab.json");

const mainInfoMap: Record<string, KanjiMainInfo> = {};
for (const kanji of Object.keys(rawMain)) {
  mainInfoMap[kanji] = transformToMainKanjiInfo(rawMain[kanji]);
}

// Mirrors what the worker's kanji-hover handler assembles before calling into
// the pure functions under test.
const vocabInfoFor = (word?: string) => {
  const entry = word == null ? null : rawVocab[word];
  if (word == null || entry == null) {
    return null;
  }
  return {
    word,
    meaning: entry[1],
    wordPartDetails: decodeFurigana(entry[0]),
  };
};

const hoverDataFor = (kanji: string) => {
  const hoverInfo = transformToHoverKanjiInfo(rawHover[kanji]);
  const withVocab: typeof hoverInfo & VocabExtendedInfo = {
    ...hoverInfo,
    vocabInfo: {
      first: vocabInfoFor(hoverInfo.mainVocab[0]),
      second: vocabInfoFor(hoverInfo.mainVocab[1]),
    },
  };

  return extractKanjiHoverData(
    mainInfoMap[kanji],
    withVocab,
    mainInfoMap,
    components
  );
};

const generalDataFor = (kanji: string) =>
  extractKanjiGeneralData(
    mainInfoMap[kanji],
    transformToGeneralKanjiInfo(rawGeneral[kanji])
  );

describe("extractKanjiHoverData (characterization against real data)", () => {
  it("五: phonetic component that is itself a kanji", () => {
    const result = hoverDataFor("五");

    expect(result.phonetic?.phonetic).toBe("五");
    expect(result.phonetic?.isKanji).toBe(true);
    expect(result.phonetic?.keyword).toBe(mainInfoMap["五"].keyword);
    expect(result).toMatchSnapshot();
  });

  it("朝: phonetic is a non-kanji component, katakana vocab chars are dropped from partsList", () => {
    const result = hoverDataFor("朝");

    expect(result.phonetic?.phonetic).toBe("𠦝");
    expect(result.phonetic?.isKanji).toBe(false);
    expect(result.phonetic?.keyword).toBe(components["𠦝"].k);
    // "テレビ朝日": the katakana have no keyword entries so only 朝/日 remain.
    expect(result.mainVocab?.first?.partsList.map((p) => p.kanji)).toEqual([
      "朝",
      "日",
    ]);
    expect(result).toMatchSnapshot();
  });

  it("一: no phonetic, no parts, okurigana dropped from partsList", () => {
    const result = hoverDataFor("一");

    expect(result.phonetic).toBeUndefined();
    expect(result.parts).toEqual([]);
    // "一つ": つ has no keyword entry.
    expect(result.mainVocab?.first?.partsList.map((p) => p.kanji)).toEqual([
      "一",
    ]);
    expect(result).toMatchSnapshot();
  });

  it("六: parts mix kanji and non-kanji components", () => {
    const result = hoverDataFor("六");

    expect(result.parts).toEqual([
      { part: "亠", keyword: components["亠"].k, isKanji: false },
      { part: "八", keyword: mainInfoMap["八"].keyword, isKanji: true },
    ]);
    expect(result).toMatchSnapshot();
  });

  it("labels every part as kanji or component consistently with the maps", () => {
    // A part mislabelled as a kanji links to a kanji page that does not exist.
    for (const kanji of Object.keys(rawHover).slice(0, 400)) {
      for (const part of hoverDataFor(kanji).parts) {
        expect(part.isKanji, `${kanji} / ${part.part}`).toBe(
          mainInfoMap[part.part] != null
        );
      }
    }
  });

  it("payloads survive structured clone (worker postMessage safety)", () => {
    for (const kanji of ["五", "朝", "一", "六"]) {
      expect(() => structuredClone(hoverDataFor(kanji))).not.toThrow();
    }
  });
});

describe("extractKanjiGeneralData (characterization against real data)", () => {
  it("朝: allOn is katakana, allKun stays hiragana, jlpt comes from main info", () => {
    const result = generalDataFor("朝");

    expect(result.jlpt).toBe(mainInfoMap["朝"].jlpt);
    expect(result).toMatchSnapshot();
  });

  it("五: pinned payload", () => {
    const result = generalDataFor("五");

    expect(() => structuredClone(result)).not.toThrow();
    expect(result).toMatchSnapshot();
  });

  it("takes its numeric fields from the main info", () => {
    const result = generalDataFor("六");
    const main = mainInfoMap["六"];

    expect(result.strokes).toBe(main.strokes);
    expect(result.jouyouGrade).toBe(main.jouyouGrade);
    expect(result.wk).toBe(main.wk);
    expect(result.rtk).toBe(main.rtk);
    expect(result.kklcIndex).toBe(main.kklcIndex);
  });
});
