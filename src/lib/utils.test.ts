import { describe, expect, it } from "vitest";
import {
  checkIfInputField,
  clamp,
  cn,
  dedupe,
  isKanji,
  percent,
  roundedMean,
  shuffle,
  toNum,
} from "./utils";

describe("cn", () => {
  it("merges conflicting tailwind classes, keeping the last", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});

describe("clamp", () => {
  it("returns the number when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps below min and above max", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("percent", () => {
  it("rounds the percentage", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(2, 3)).toBe(67);
  });

  it("returns the fallback when total is 0", () => {
    expect(percent(5, 0)).toBe(0);
    expect(percent(5, 0, 42)).toBe(42);
  });
});

describe("roundedMean", () => {
  it("returns the rounded mean", () => {
    expect(roundedMean([1, 2])).toBe(2);
    expect(roundedMean([1, 2, 3])).toBe(2);
  });

  it("returns null for an empty array", () => {
    expect(roundedMean([])).toBeNull();
  });
});

describe("toNum", () => {
  it("parses numeric strings", () => {
    expect(toNum("42")).toBe(42);
    expect(toNum("4.5")).toBe(4.5);
  });

  it("falls back for non-numeric strings, null, undefined, and numbers", () => {
    expect(toNum("abc")).toBe(0);
    expect(toNum("abc", 7)).toBe(7);
    expect(toNum(null, 7)).toBe(7);
    expect(toNum(undefined)).toBe(0);
    // numbers are not passed through; they hit the fallback
    expect(toNum(3, 7)).toBe(7);
  });
});

describe("checkIfInputField", () => {
  it("detects input and textarea elements", () => {
    expect(checkIfInputField(document.createElement("input"))).toBe(true);
    expect(checkIfInputField(document.createElement("textarea"))).toBe(true);
  });

  it("rejects plain elements", () => {
    expect(checkIfInputField(document.createElement("div"))).toBeFalsy();
  });
});

describe("isKanji", () => {
  it("accepts CJK unified ideographs", () => {
    expect(isKanji("水")).toBe(true);
    expect(isKanji("日")).toBe(true);
  });

  it("rejects kana and latin characters", () => {
    expect(isKanji("あ")).toBe(false);
    expect(isKanji("ア")).toBe(false);
    expect(isKanji("a")).toBe(false);
  });
});

describe("dedupe", () => {
  it("removes duplicates while preserving first-seen order", () => {
    expect(dedupe([3, 1, 3, 2, 1])).toEqual([3, 1, 2]);
  });

  it("returns an empty array unchanged", () => {
    expect(dedupe([])).toEqual([]);
  });
});

describe("shuffle", () => {
  it("keeps the same members and does not mutate the input", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    const result = shuffle(input);
    expect(input).toEqual(copy);
    expect([...result].sort()).toEqual([...input].sort());
  });
});
