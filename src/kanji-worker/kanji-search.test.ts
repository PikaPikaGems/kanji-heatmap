import { describe, expect, it } from "vitest";
import {
  KanjiExtendedInfo,
  KanjiInfoFrequency,
  KanjiMainInfo,
} from "@/lib/kanji/kanji-worker-types";
import { SearchSettings, SearchType } from "@/lib/settings/settings";
import { SortKey } from "@/lib/options/options-types";
import { JLTPTtypes } from "@/lib/jlpt";
import { filterKanji, searchKanji, sortKanji } from "./kanji-search";

const mainInfo = (
  keyword: string,
  jlpt: JLTPTtypes = "none",
  netflix: number | null = null
): KanjiMainInfo => ({
  keyword,
  jlpt,
  on: "",
  kun: "",
  frequency: { netflix } as KanjiInfoFrequency,
});

const extendedInfo = ({
  strokes = 1,
  meanings = [],
  allOn = [],
  allKunStripped = [],
  jouyouGrade = -1,
}: {
  strokes?: number;
  meanings?: string[];
  allOn?: string[];
  allKunStripped?: string[];
  jouyouGrade?: number;
}): KanjiExtendedInfo => ({
  parts: new Set(),
  strokes,
  rtk: -1,
  rtkb: -1,
  wk: -1,
  jouyouGrade,
  meanings,
  allOn: new Set(allOn),
  allKun: new Set(allKunStripped),
  allKunStripped: new Set(allKunStripped),
  kklcIndex: -1,
});

// 水 (water), 火 (fire), 山 (mountain) — enough to exercise every search type.
const pool = {
  main: {
    水: mainInfo("water", "n5", 10),
    火: mainInfo("fire", "n4", 5),
    山: mainInfo("mountain", "none", null),
  },
  extended: {
    水: extendedInfo({
      strokes: 4,
      meanings: ["water", "liquid"],
      allOn: ["すい"],
      allKunStripped: ["みず"],
      jouyouGrade: 1,
    }),
    火: extendedInfo({
      strokes: 4,
      meanings: ["fire", "flame"],
      allOn: ["か"],
      allKunStripped: ["ひ"],
      jouyouGrade: 1,
    }),
    山: extendedInfo({
      strokes: 3,
      meanings: ["mountain"],
      allOn: ["さん"],
      allKunStripped: ["やま"],
      jouyouGrade: 2,
    }),
  },
  similar: { 水: ["氷"] },
};

const allKanji = Object.keys(pool.main);

const settings = ({
  type = "readings",
  text = "",
  primary = "none",
  secondary = "none",
}: {
  type?: SearchType;
  text?: string;
  primary?: SortKey;
  secondary?: SortKey;
}): SearchSettings => ({
  textSearch: { type, text },
  filterSettings: {
    strokeRange: { min: 1, max: 99 },
    jlpt: [],
    freq: { source: "none", rankRange: { min: 1, max: 99999 } },
  },
  sortSettings: { primary, secondary },
});

describe("filterKanji", () => {
  it("returns everything when the search text is empty", () => {
    expect(filterKanji(allKanji, settings({}), pool)).toEqual(allKanji);
  });

  it("keyword: matches romaji-normalized text against the keyword", () => {
    expect(
      filterKanji(allKanji, settings({ type: "keyword", text: "WATER" }), pool)
    ).toEqual(["水"]);
  });

  it("meanings: matches keyword or any meaning", () => {
    expect(
      filterKanji(
        allKanji,
        settings({ type: "meanings", text: "liquid" }),
        pool
      )
    ).toEqual(["水"]);
  });

  it("onyomi/kunyomi: converts romaji to hiragana before matching", () => {
    expect(
      filterKanji(allKanji, settings({ type: "onyomi", text: "sui" }), pool)
    ).toEqual(["水"]);
    expect(
      filterKanji(allKanji, settings({ type: "kunyomi", text: "yama" }), pool)
    ).toEqual(["山"]);
  });

  it("readings: matches either on or kun readings", () => {
    expect(
      filterKanji(allKanji, settings({ type: "readings", text: "みず" }), pool)
    ).toEqual(["水"]);
    expect(
      filterKanji(allKanji, settings({ type: "readings", text: "さん" }), pool)
    ).toEqual(["山"]);
  });

  it("multi-kanji and handwriting: match kanji characters found in the text", () => {
    const types: SearchType[] = [
      "multi-kanji",
      "handwriting",
      "handwriting-alt",
      "handwriting-alt-2",
    ];
    for (const type of types) {
      expect(
        filterKanji(allKanji, settings({ type, text: "水火とmizu" }), pool)
      ).toEqual(["水", "火"]);
    }
  });

  it("similar: expands the query kanji with its similar-map neighbors", () => {
    const result = filterKanji(
      ["水", "火"],
      settings({ type: "similar", text: "水" }),
      pool
    );
    // 氷 is similar but not in the pool, so only 水 survives.
    expect(result).toEqual(["水"]);
  });
});

describe("sortKanji", () => {
  it("returns the list untouched when primary sort is none", () => {
    const list = ["山", "水"];
    expect(sortKanji(list, settings({}), pool)).toBe(list);
  });

  it("sorts by the primary key", () => {
    expect(
      sortKanji(["水", "山", "火"], settings({ primary: "strokes" }), pool)
    ).toEqual(["山", "水", "火"]);
  });

  it("breaks primary ties with the secondary key", () => {
    expect(
      sortKanji(
        ["火", "水", "山"],
        settings({ primary: "strokes", secondary: "keyword" }),
        pool
      )
    ).toEqual(["山", "火", "水"]);
  });

  it("sorts frequency keys, pushing unranked kanji last", () => {
    expect(
      sortKanji(["山", "水", "火"], settings({ primary: "rank-netflix" }), pool)
    ).toEqual(["火", "水", "山"]);
  });

  it("sorts jlpt from N5 (easiest) upward", () => {
    expect(
      sortKanji(["山", "火", "水"], settings({ primary: "jlpt" }), pool)
    ).toEqual(["水", "火", "山"]);
  });
});

describe("searchKanji", () => {
  it("filters then sorts in one pass", () => {
    const result = searchKanji(
      settings({ type: "readings", text: "", primary: "strokes" }),
      pool
    );
    expect(result).toEqual(["山", "水", "火"]);
  });

  it("skips kanji that exist in main but lack extended info", () => {
    const mismatchedPool = {
      main: {
        ...pool.main,
        氷: mainInfo("ice", "n2", 20),
      },
      extended: pool.extended,
    };

    expect(() =>
      searchKanji(
        settings({ type: "readings", text: "", primary: "strokes" }),
        mismatchedPool
      )
    ).not.toThrow();

    expect(
      searchKanji(
        settings({ type: "readings", text: "", primary: "strokes" }),
        mismatchedPool
      )
    ).toEqual(["山", "水", "火"]);
  });
});
