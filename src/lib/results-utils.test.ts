import { describe, expect, it } from "vitest";
import { SearchSettings } from "@/lib/settings/settings";
import {
  defaultFilterSettings,
  defaultSearchTextSettings,
  defaultSortSettings,
} from "@/lib/settings/search-settings-adapter";
import { getFinalResults } from "./results-utils";

const settings = (
  type: SearchSettings["textSearch"]["type"],
  text: string,
  overrides: Partial<SearchSettings> = {}
): SearchSettings => ({
  textSearch: { ...defaultSearchTextSettings, type, text },
  filterSettings: defaultFilterSettings,
  sortSettings: defaultSortSettings,
  ...overrides,
});

describe("getFinalResults", () => {
  it("keeps the result (sort) order for other search types", () => {
    expect(getFinalResults(settings("keyword", "x"), ["b", "a"])).toEqual([
      "b",
      "a",
    ]);
  });

  it("follows the pasted order for multi-kanji, ignoring sort order", () => {
    const sorted = ["日", "月", "火"];
    const withSort = settings("multi-kanji", "火日月", {
      sortSettings: { ...defaultSortSettings, primary: "rtk-index" },
    });
    expect(getFinalResults(withSort, sorted)).toEqual(["火", "日", "月"]);
  });

  it("dedupes and drops non-kanji characters", () => {
    expect(
      getFinalResults(settings("multi-kanji", "火あ火日abc"), ["日", "火"])
    ).toEqual(["火", "日"]);
  });

  it("skips pasted kanji removed by active filters", () => {
    const filtered = settings("multi-kanji", "火日月", {
      filterSettings: { ...defaultFilterSettings, bookmarkedOnly: true },
    });
    expect(getFinalResults(filtered, ["月", "火"])).toEqual(["火", "月"]);
  });

  it("falls back to the result order when no kanji were pasted", () => {
    expect(getFinalResults(settings("multi-kanji", "abc"), ["日"])).toEqual([
      "日",
    ]);
  });
});
