import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  isKnownRadical,
  moreRadicalKeywords,
  nonRadicalVariantKeywords,
  radicalFalseFriends,
  radicalStrokeCountMap,
  radicalsGroupedByStrokeCount,
} from "./radicals";

// These tables moved from hand-written TypeScript into raw-data/radicals.json
// so the app and the JSON generator read one source. The tests below guard the
// contract that move relies on: the same values reach the app, and the data
// stays clean enough to be looked up by exact string match.

describe("radicals data loaded from raw-data/radicals.json", () => {
  it("exposes every table with the expected size", () => {
    expect(Object.keys(radicalsGroupedByStrokeCount)).toHaveLength(15);
    expect(Object.keys(moreRadicalKeywords)).toHaveLength(45);
    expect(Object.keys(nonRadicalVariantKeywords)).toHaveLength(5);
    expect(Object.keys(radicalFalseFriends)).toHaveLength(18);
  });

  it("keeps known sample values intact after the move", () => {
    expect(radicalsGroupedByStrokeCount["1"]).toEqual([
      "一",
      "｜",
      "丶",
      "ノ",
      "乙",
      "亅",
    ]);
    expect(moreRadicalKeywords["⺡"]).toBe("water variant");
    expect(nonRadicalVariantKeywords["昜"]).toBe("light of the sun");
  });

  it("stores alias values without surrounding whitespace", () => {
    // 艹 used to map to " ⺾" (leading space), so the alias could never be
    // matched against a real character. Every value must be lookup-ready.
    for (const [char, alias] of Object.entries(radicalFalseFriends)) {
      expect(alias, `alias for ${char}`).toBe(alias.trim());
      expect(alias.length, `alias for ${char}`).toBeGreaterThan(0);
    }
    expect(radicalFalseFriends["艹"]).toBe("⺾");
  });

  it("resolves every alias to a character that has a keyword somewhere", () => {
    // An alias pointing at nothing is a silent dead end: call sites fall back
    // to the alias, find nothing, and render "...". Check against every source
    // the app consults, including the fetched component/kanji keyword maps.
    const readRawData = <T>(name: string): T =>
      JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "raw-data", name), "utf8")
      ) as T;
    const componentKeywords = readRawData<Record<string, string>>(
      "component_keyword.json"
    );
    const kanjiMain = readRawData<Record<string, unknown>>("kanji_main.json");

    for (const [char, alias] of Object.entries(radicalFalseFriends)) {
      const resolvable =
        alias in radicalStrokeCountMap ||
        alias in moreRadicalKeywords ||
        alias in nonRadicalVariantKeywords ||
        alias in componentKeywords ||
        alias in kanjiMain;
      expect(resolvable, `${char} -> ${alias} resolves to a known entry`).toBe(
        true
      );
    }
  });

  it("never aliases a character to itself", () => {
    for (const [char, alias] of Object.entries(radicalFalseFriends)) {
      expect(alias, `alias for ${char}`).not.toBe(char);
    }
  });

  it("builds radicalStrokeCountMap from the grouped table", () => {
    const grouped = Object.entries(radicalsGroupedByStrokeCount);
    const total = grouped.reduce((sum, [, list]) => sum + list.length, 0);

    expect(Object.keys(radicalStrokeCountMap)).toHaveLength(total);
    expect(radicalStrokeCountMap["一"]).toBe("1");
    expect(radicalStrokeCountMap["龠"]).toBe("17");
  });

  it("lists each radical under exactly one stroke count", () => {
    const seen = new Set<string>();
    for (const [, list] of Object.entries(radicalsGroupedByStrokeCount)) {
      for (const radical of list) {
        expect(seen.has(radical), `${radical} appears twice`).toBe(false);
        seen.add(radical);
      }
    }
  });

  it("treats grouped radicals and alias keys as known", () => {
    expect(isKnownRadical("一")).toBe(true);
    expect(isKnownRadical("艹")).toBe(true); // known via the alias table
    expect(isKnownRadical("猫")).toBe(false);
  });
});
