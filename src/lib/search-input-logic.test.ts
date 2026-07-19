import { describe, expect, it } from "vitest";
import {
  inferSearchTypeFromText,
  isDialogType,
  resolvePaste,
  searchTypeLabel,
  stripToKanji,
} from "./search-input-logic";

describe("isDialogType", () => {
  it("identifies drawer-based search types", () => {
    expect(isDialogType("radicals")).toBe(true);
    expect(isDialogType("handwriting")).toBe(true);
    expect(isDialogType("handwriting-alt")).toBe(true);
    expect(isDialogType("handwriting-alt-2")).toBe(true);
  });

  it("rejects typed search types", () => {
    expect(isDialogType("readings")).toBe(false);
    expect(isDialogType("multi-kanji")).toBe(false);
    expect(isDialogType("similar")).toBe(false);
  });
});

describe("stripToKanji", () => {
  it("keeps only kanji characters", () => {
    expect(stripToKanji("水とみずと火")).toBe("水火");
  });

  it("returns empty for text without kanji", () => {
    expect(stripToKanji("みず mizu 123")).toBe("");
  });
});

describe("searchTypeLabel", () => {
  it("maps a type to its display label", () => {
    expect(searchTypeLabel("multi-kanji")).toBe("Multi-Kanji");
    expect(searchTypeLabel("readings")).toBe("Readings");
  });
});

describe("inferSearchTypeFromText", () => {
  it("returns null for empty text", () => {
    expect(inferSearchTypeFromText("", "readings")).toBe(null);
  });

  it("infers multi-kanji when the text contains kanji", () => {
    expect(inferSearchTypeFromText("水", "readings")).toBe("multi-kanji");
    expect(inferSearchTypeFromText("お水", "meanings")).toBe("multi-kanji");
  });

  it("infers readings for pure kana", () => {
    expect(inferSearchTypeFromText("みず", "meanings")).toBe("readings");
    expect(inferSearchTypeFromText("ミズ", "keyword")).toBe("readings");
  });

  it("moves a roman word out of multi-kanji into meanings", () => {
    expect(inferSearchTypeFromText("water", "multi-kanji")).toBe("meanings");
  });

  it("leaves roman text alone for non-multi-kanji types", () => {
    expect(inferSearchTypeFromText("water", "meanings")).toBe(null);
    expect(inferSearchTypeFromText("water", "keyword")).toBe(null);
  });
});

describe("resolvePaste", () => {
  const base = {
    currentValue: "",
    selectionStart: 0,
    selectionEnd: 0,
    searchType: "readings" as const,
  };

  it("ignores whitespace-only pastes", () => {
    expect(resolvePaste({ ...base, pasted: "   " })).toBe(null);
  });

  it("switches to multi-kanji for kanji paste and announces", () => {
    expect(resolvePaste({ ...base, pasted: "水火" })).toEqual({
      value: "水火",
      caret: 2,
      nextType: "multi-kanji",
      announce: true,
    });
  });

  it("inserts at the caret, replacing the selection", () => {
    expect(
      resolvePaste({
        ...base,
        pasted: "火",
        currentValue: "水土",
        selectionStart: 1,
        selectionEnd: 2,
        searchType: "multi-kanji",
      })
    ).toEqual({
      value: "水火",
      caret: 2,
      nextType: "multi-kanji",
      announce: true,
    });
  });

  it("keeps similar-type pastes kanji-only without announcing", () => {
    expect(
      resolvePaste({
        ...base,
        pasted: "水のみず",
        currentValue: "火",
        selectionStart: 1,
        selectionEnd: 1,
        searchType: "similar",
      })
    ).toEqual({
      value: "火水",
      caret: 2,
      nextType: "similar",
      announce: false,
    });
  });

  it("ignores a similar-type paste that leaves no kanji", () => {
    // hasKanji can disagree with isKanji for rare CJK codepoints; simulate by
    // pasting a kanji into an empty field then stripping — the everyday case
    // is a paste whose only kanji fails isKanji. 々 is kana-adjacent: wanakana
    // counts it as kanji but isKanji (CJK unified block) does not.
    expect(resolvePaste({ ...base, pasted: "々", searchType: "similar" })).toBe(
      null
    );
  });

  it("switches to readings for kana paste and announces", () => {
    expect(
      resolvePaste({ ...base, pasted: "みず", searchType: "meanings" })
    ).toEqual({
      value: "みず",
      caret: 2,
      nextType: "readings",
      announce: true,
    });
  });

  it("sends roman words to meanings (or keeps keyword)", () => {
    expect(resolvePaste({ ...base, pasted: "water" })).toEqual({
      value: "water",
      caret: 5,
      nextType: "meanings",
      announce: true,
    });
    expect(
      resolvePaste({ ...base, pasted: "water", searchType: "keyword" })
    ).toEqual({
      value: "water",
      caret: 5,
      nextType: "keyword",
      announce: true,
    });
  });

  it("keeps the current type for mixed/ambiguous pastes", () => {
    const result = resolvePaste({
      ...base,
      pasted: "みずwater",
      searchType: "readings",
    });
    expect(result?.nextType).toBe("readings");
    expect(result?.announce).toBe(false);
  });
});
