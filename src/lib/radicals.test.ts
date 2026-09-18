import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  isKnownRadical,
  prepareRadicals,
  resolveRadicalForSearch,
  strokeCountMapFromGrouped,
  type RadicalsFile,
} from "./radicals";

const radicals = prepareRadicals(
  JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public", "json", "v2", "radicals.json"),
      "utf8"
    )
  ) as RadicalsFile
);

describe("radicals.json (fetched at runtime)", () => {
  it("exposes every table with the expected size", () => {
    expect(Object.keys(radicals.groupedByStrokeCount)).toHaveLength(15);
    expect(Object.keys(radicals.aliases).length).toBeGreaterThan(0);
    expect(radicals.aliases["飠"]).toBe("食");
    expect(radicals.aliases["𩙿"]).toBe("食");
    expect(radicals.aliases["⺩"]).toBe("王");
  });

  it("keeps known sample values intact", () => {
    expect(radicals.groupedByStrokeCount["1"]).toEqual([
      "一",
      "｜",
      "丶",
      "ノ",
      "乙",
      "亅",
    ]);
  });

  it("stores alias values without surrounding whitespace", () => {
    for (const [char, alias] of Object.entries(radicals.aliases)) {
      expect(alias, `alias for ${char}`).toBe(alias.trim());
      expect(alias.length, `alias for ${char}`).toBeGreaterThan(0);
    }
    expect(radicals.aliases["艹"]).toBe("⺾");
    expect(radicals.aliases["艸"]).toBe("艹");
  });

  it("never aliases a character to itself", () => {
    for (const [char, alias] of Object.entries(radicals.aliases)) {
      expect(alias, `alias for ${char}`).not.toBe(char);
    }
  });

  it("builds strokeCountMap from the grouped table", () => {
    const grouped = Object.entries(radicals.groupedByStrokeCount);
    const total = grouped.reduce((sum, [, list]) => sum + list.length, 0);
    const strokeCountMap = strokeCountMapFromGrouped(
      radicals.groupedByStrokeCount
    );

    expect(Object.keys(strokeCountMap)).toHaveLength(total);
    expect(strokeCountMap["一"]).toBe("1");
    expect(strokeCountMap["龠"]).toBe("17");
  });

  it("lists each radical under exactly one stroke count", () => {
    const seen = new Set<string>();
    for (const [, list] of Object.entries(radicals.groupedByStrokeCount)) {
      for (const radical of list) {
        expect(seen.has(radical), `${radical} appears twice`).toBe(false);
        seen.add(radical);
      }
    }
  });

  it("treats grouped radicals and alias keys as known", () => {
    expect(isKnownRadical("一", radicals)).toBe(true);
    expect(isKnownRadical("艹", radicals)).toBe(true);
    expect(isKnownRadical("飠", radicals)).toBe(true);
    expect(isKnownRadical("猫", radicals)).toBe(false);
  });

  it("resolves aliases onto a drawer radical", () => {
    expect(resolveRadicalForSearch("飠", radicals)).toBe("食");
    expect(resolveRadicalForSearch("⺩", radicals)).toBe("王");
    expect(resolveRadicalForSearch("艸", radicals)).toBe("⺾");
    expect(resolveRadicalForSearch("一", radicals)).toBe("一");
  });
});
