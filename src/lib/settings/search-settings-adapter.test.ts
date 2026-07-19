import { describe, expect, it } from "vitest";
import { SearchSettings } from "@/lib/settings/settings";
import {
  defaultFilterSettings,
  defaultSearchTextSettings,
  defaultSortSettings,
  toSearchParams,
  toSearchSettings,
} from "./search-settings-adapter";

const writeAll = (settings: SearchSettings) => {
  const params = new URLSearchParams();
  toSearchParams(params, "textSearch", settings.textSearch);
  toSearchParams(params, "filterSettings", settings.filterSettings);
  toSearchParams(params, "sortSettings", settings.sortSettings);
  return params;
};

const defaults: SearchSettings = {
  textSearch: defaultSearchTextSettings,
  filterSettings: defaultFilterSettings,
  sortSettings: defaultSortSettings,
};

describe("search settings ↔ URL params round-trip", () => {
  it("default settings produce an empty URL and read back as defaults", () => {
    const params = writeAll(defaults);
    expect(params.toString()).toBe("");
    expect(toSearchSettings(params)).toEqual(defaults);
  });

  it("non-default settings survive the round-trip", () => {
    const settings: SearchSettings = {
      textSearch: { type: "onyomi", text: "すい" },
      filterSettings: {
        strokeRange: { min: 3, max: 10 },
        jlpt: ["n5", "n4"],
        freq: { source: "rank-netflix", rankRange: { min: 5, max: 100 } },
      },
      sortSettings: { primary: "strokes", secondary: "keyword" },
    };

    expect(toSearchSettings(writeAll(settings))).toEqual({
      ...settings,
      // The adapter canonicalizes text per type; onyomi normalizes to katakana.
      textSearch: { type: "onyomi", text: "スイ" },
    });
  });

  it("omits default-valued params from the URL", () => {
    const params = writeAll({
      ...defaults,
      textSearch: { type: "readings", text: "みず" },
    });
    // Text appears; the default search type does not.
    expect(params.has("search-text")).toBe(true);
    expect([...params.keys()]).toHaveLength(1);
  });

  it("drops the rank range when the frequency source is none", () => {
    const params = writeAll({
      ...defaults,
      filterSettings: {
        ...defaultFilterSettings,
        freq: { source: "none", rankRange: { min: 5, max: 100 } },
      },
    });
    expect(params.toString()).toBe("");
  });

  it("drops the secondary sort when the primary is none", () => {
    const params = writeAll({
      ...defaults,
      sortSettings: { primary: "none", secondary: "keyword" },
    });
    expect(params.toString()).toBe("");
  });

  it("overwrites previously set params when a setting returns to default", () => {
    const params = writeAll({
      ...defaults,
      sortSettings: { primary: "strokes", secondary: "keyword" },
    });
    toSearchParams(params, "sortSettings", defaultSortSettings);
    expect(params.toString()).toBe("");
  });
});
