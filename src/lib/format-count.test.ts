import { describe, expect, it } from "vitest";
import { formatCompactCount, formatRawCount } from "./format-count";

describe("formatRawCount", () => {
  it("adds grouping separators", () => {
    expect(formatRawCount(7434)).toBe("7,434");
    expect(formatRawCount(0)).toBe("0");
  });
});

describe("formatCompactCount", () => {
  it("keeps values under 1000 raw", () => {
    expect(formatCompactCount(999)).toBe("999");
    expect(formatCompactCount(0)).toBe("0");
  });

  it("abbreviates thousands to one decimal", () => {
    expect(formatCompactCount(7434)).toBe("~7.4k");
    expect(formatCompactCount(10100)).toBe("~10.1k");
  });

  it("drops the decimal when it rounds to an integer", () => {
    expect(formatCompactCount(1000)).toBe("~1k");
    expect(formatCompactCount(2049)).toBe("~2k");
  });

  it("rounds to whole k from 100k up", () => {
    expect(formatCompactCount(101234)).toBe("~101k");
    expect(formatCompactCount(99_949)).toBe("~99.9k");
    expect(formatCompactCount(100_000)).toBe("~100k");
  });
});
