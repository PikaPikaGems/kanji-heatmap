import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  KanjiCacheType,
  KanjiPartKeywordCacheType,
  KanjiPhoneticCacheType,
  VocabExtendedInfo,
} from "@/lib/kanji/kanji-info-types";
import {
  ExtendedKanjiInfoResponseType,
  KanjiExtendedInfo,
  MainKanjiInfoResponseType,
  WordPartDetail,
} from "@/lib/kanji/kanji-worker-types";
import {
  transformToExtendedKanjiInfo,
  transformToMainKanjiInfo,
} from "./helpers";
import {
  extractKanjiGeneralData,
  extractKanjiHoverData,
} from "./kanji-assembly";

// Characterization tests: pin the EXACT hover/"general" payloads produced from
// the real production JSON, so the assembly logic can move (main thread →
// worker) and the data files can be regenerated (v1 → v2) without any
// behavior change going unnoticed. The cache-building below replicates the
// production pipeline: helpers.ts transforms + the worker's kanji-extended
// response shape (extended info merged with vocabInfo).

const readJson = <T>(name: string): T =>
  JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public/json", name), "utf8")
  ) as T;

const rawMain = readJson<MainKanjiInfoResponseType>("kanji_main.json");
const rawExtended = readJson<ExtendedKanjiInfoResponseType>(
  "kanji_extended.json"
);
const partKeywordCache = readJson<KanjiPartKeywordCacheType>(
  "component_keyword.json"
);
const phoneticCache = readJson<KanjiPhoneticCacheType>("phonetic.json");
const vocabFurigana = readJson<Record<string, WordPartDetail[]>>(
  "vocab_furigana.json"
);
const vocabMeaning = readJson<Record<string, string>>("vocab_meaning.json");

const kanjiCache: KanjiCacheType = {};
Object.keys(rawMain).forEach((k) => {
  kanjiCache[k] = { main: transformToMainKanjiInfo(rawMain[k]) };
});

// Mirrors the worker's retrieveVocabInfo + handleKanjiExtended reply payload.
const retrieveVocabInfo = (word?: string) => {
  if (word == null || vocabFurigana[word] == null) {
    return null;
  }
  return {
    word,
    meaning: vocabMeaning[word],
    wordPartDetails: vocabFurigana[word],
  };
};

const workerExtendedResponse = (kanji: string) => {
  const extendedInfo = transformToExtendedKanjiInfo(rawExtended[kanji]);
  return {
    ...extendedInfo,
    vocabInfo: {
      first: retrieveVocabInfo(extendedInfo.mainVocab?.[0]),
      second: retrieveVocabInfo(extendedInfo.mainVocab?.[1]),
    },
  } as KanjiExtendedInfo & VocabExtendedInfo;
};

const hoverDataFor = (kanji: string) =>
  extractKanjiHoverData(
    kanjiCache[kanji],
    workerExtendedResponse(kanji),
    kanjiCache,
    partKeywordCache,
    phoneticCache
  );

describe("extractKanjiHoverData (characterization against real data)", () => {
  it("五: phonetic component that is itself a kanji", () => {
    const result = hoverDataFor("五");

    expect(result.phonetic?.phonetic).toBe("五");
    expect(result.phonetic?.isKanji).toBe(true);
    expect(result.phonetic?.keyword).toBe(kanjiCache["五"].main.keyword);
    expect(result).toMatchSnapshot();
  });

  it("朝: phonetic is a non-kanji component, katakana vocab chars are dropped from partsList", () => {
    const result = hoverDataFor("朝");

    expect(result.phonetic?.phonetic).toBe("𠦝");
    expect(result.phonetic?.isKanji).toBe(false);
    expect(result.phonetic?.keyword).toBe(partKeywordCache["𠦝"]);
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
      { part: "亠", keyword: partKeywordCache["亠"], isKanji: false },
      { part: "八", keyword: kanjiCache["八"].main.keyword, isKanji: true },
    ]);
    expect(result).toMatchSnapshot();
  });

  it("payloads survive structured clone (worker postMessage safety)", () => {
    for (const kanji of ["五", "朝", "一", "六"]) {
      expect(() => structuredClone(hoverDataFor(kanji))).not.toThrow();
    }
  });
});

describe("extractKanjiGeneralData (characterization against real data)", () => {
  it("朝: allOn is katakana, allKun stays hiragana, jlpt comes from main info", () => {
    const result = extractKanjiGeneralData(
      kanjiCache["朝"],
      workerExtendedResponse("朝")
    );

    expect(result.jlpt).toBe(kanjiCache["朝"].main.jlpt);
    // The GeneralKanjiItem type declares rtkb, but the runtime payload has
    // never carried it — pinned so a future protocol change can't silently
    // alter the shape.
    expect("rtkb" in result).toBe(false);
    expect(result).toMatchSnapshot();
  });

  it("五: pinned payload", () => {
    const result = extractKanjiGeneralData(
      kanjiCache["五"],
      workerExtendedResponse("五")
    );

    expect(() => structuredClone(result)).not.toThrow();
    expect(result).toMatchSnapshot();
  });
});
