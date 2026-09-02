import { describe, expect, it } from "vitest";
import {
  KanjiGeneralInfo,
  KanjiInfoFrequency,
  KanjiMainInfo,
} from "@/lib/kanji/kanji-worker-types";
import { SearchSettings, SearchType } from "@/lib/settings/settings";
import { SortKey } from "@/lib/options/options-types";
import { JLTPTtypes } from "@/lib/jlpt";
import { JOUYOU_GRADE_TYPE_ARR, JouyouGradeType } from "@/lib/jouyou-grade";
import { filterKanji, searchKanji, sortKanji } from "./kanji-search";

const mainInfo = (
  keyword: string,
  jlpt: JLTPTtypes = "none",
  netflix: number | null = null,
  // Sort and filter read these from the main info, so the fixtures carry them.
  numbers: {
    strokes?: number;
    jouyouGrade?: number;
    wk?: number;
    kklcIndex?: number;
    rtk?: number;
    topoTwitterIndex?: number;
  } = {}
): KanjiMainInfo => ({
  keyword,
  jlpt,
  on: "",
  kun: "",
  frequency: { netflix } as KanjiInfoFrequency,
  strokes: numbers.strokes ?? 1,
  jouyouGrade: numbers.jouyouGrade ?? -1,
  wk: numbers.wk ?? -1,
  kklcIndex: numbers.kklcIndex ?? -1,
  rtk: numbers.rtk ?? -1,
  topoTwitterIndex: numbers.topoTwitterIndex ?? -1,
  repWord: null,
  repReading: null,
});

// Meanings and readings only: strokes and grade now live on the main info.
const extendedInfo = ({
  meanings = [],
  allOn = [],
  allKunStripped = [],
}: {
  meanings?: string[];
  allOn?: string[];
  allKunStripped?: string[];
}): KanjiGeneralInfo => ({
  meanings,
  allOn: new Set(allOn),
  allKun: new Set(allKunStripped),
  allKunStripped: new Set(allKunStripped),
});

// 水 (water), 火 (fire), 山 (mountain) — enough to exercise every search type.
const pool = {
  main: {
    水: mainInfo("water", "n5", 10, { strokes: 4, jouyouGrade: 1 }),
    火: mainInfo("fire", "n4", 5, { strokes: 4, jouyouGrade: -1 }),
    山: mainInfo("mountain", "none", null, { strokes: 3, jouyouGrade: 2 }),
  },
  extended: {
    水: extendedInfo({
      meanings: ["water", "liquid"],
      allOn: ["すい"],
      allKunStripped: ["みず"],
    }),
    火: extendedInfo({
      meanings: ["fire", "flame"],
      allOn: ["か"],
      allKunStripped: ["ひ"],
    }),
    山: extendedInfo({
      meanings: ["mountain"],
      allOn: ["さん"],
      allKunStripped: ["やま"],
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
  jlpt = [],
  jouyouGrade = [],
}: {
  type?: SearchType;
  text?: string;
  primary?: SortKey;
  secondary?: SortKey;
  jlpt?: JLTPTtypes[];
  jouyouGrade?: JouyouGradeType[];
}): SearchSettings => ({
  textSearch: { type, text },
  filterSettings: {
    strokeRange: { min: 1, max: 99 },
    jlpt,
    jouyouGrade,
    freq: { source: "none", rankRange: { min: 1, max: 99999 } },
    bookmarkedOnly: false,
    withAnchorWordsOnly: false,
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

  it("filters by one or more Jouyou grades", () => {
    expect(
      filterKanji(allKanji, settings({ jouyouGrade: ["1"] }), pool)
    ).toEqual(["水"]);
    expect(
      filterKanji(allKanji, settings({ jouyouGrade: ["1", "2"] }), pool)
    ).toEqual(["水", "山"]);
  });

  it("filters for kanji without an assigned Jouyou grade", () => {
    expect(
      filterKanji(allKanji, settings({ jouyouGrade: ["none"] }), pool)
    ).toEqual(["火"]);
  });

  it("treats empty and all-grade selections as unrestricted", () => {
    expect(filterKanji(allKanji, settings({ jouyouGrade: [] }), pool)).toEqual(
      allKanji
    );
    expect(
      filterKanji(
        allKanji,
        settings({ jouyouGrade: [...JOUYOU_GRADE_TYPE_ARR] }),
        pool
      )
    ).toEqual(allKanji);
  });

  it("combines JLPT and Jouyou-grade filters", () => {
    expect(
      filterKanji(
        allKanji,
        settings({ jlpt: ["n5"], jouyouGrade: ["1"] }),
        pool
      )
    ).toEqual(["水"]);
    expect(
      filterKanji(
        allKanji,
        settings({ jlpt: ["n4"], jouyouGrade: ["1"] }),
        pool
      )
    ).toEqual([]);
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

  it("does not crash or match text when a kanji lacks extended info", () => {
    // Strokes and grade come from the main info now, so a kanji present in
    // main is filtered and sorted normally even with no extended entry. What
    // must still hold is that text searches, which do read extended, skip it
    // instead of throwing.
    const mismatchedPool = {
      main: {
        ...pool.main,
        氷: mainInfo("ice", "n2", 20, { strokes: 5 }),
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
    ).toEqual(["山", "水", "火", "氷"]);

    // "meanings" also matches the keyword, which lives in main, so 氷 is
    // still findable without extended info.
    expect(
      searchKanji(settings({ type: "meanings", text: "ice" }), mismatchedPool)
    ).toEqual(["氷"]);

    // Reading searches read extended only, so 氷 is skipped rather than
    // throwing on undefined.
    expect(
      searchKanji(settings({ type: "onyomi", text: "hi" }), mismatchedPool)
    ).toEqual([]);
    expect(
      searchKanji(
        settings({ type: "meanings", text: "frozen" }),
        mismatchedPool
      )
    ).toEqual([]);
  });
});
