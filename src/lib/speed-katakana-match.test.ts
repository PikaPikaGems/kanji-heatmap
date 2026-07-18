import { describe, expect, it } from "vitest";
import {
  cleanTypedKana,
  isMatch,
  isOnTrack,
  stripPartialRomajiTail,
} from "./speed-katakana-match";

describe("cleanTypedKana", () => {
  it("strips ASCII and full-width whitespace", () => {
    expect(cleanTypedKana("パア セント")).toBe("パアセント");
    expect(cleanTypedKana("パアセント　")).toBe("パアセント");
  });
});

describe("stripPartialRomajiTail", () => {
  it("drops a trailing unconverted romaji fragment", () => {
    expect(stripPartialRomajiTail("パーk")).toBe("パー");
  });

  it("keeps fully converted kana", () => {
    expect(stripPartialRomajiTail("パーセント")).toBe("パーセント");
  });
});

describe("isMatch", () => {
  it("matches the exact word", () => {
    expect(isMatch("パーセント", "パーセント")).toBe(true);
  });

  it("matches a doubled vowel against the long-vowel mark ー", () => {
    // typing "paasento" converts to パアセント, which must clear パーセント
    expect(isMatch("パアセント", "パーセント")).toBe(true);
  });

  it("ignores IME-inserted whitespace", () => {
    expect(isMatch("パーセント　", "パーセント")).toBe(true);
  });

  it("rejects a wrong or incomplete word", () => {
    expect(isMatch("パセント", "パーセント")).toBe(false);
    expect(isMatch("パーセン", "パーセント")).toBe(false);
  });
});

describe("isOnTrack", () => {
  it("accepts empty input and correct prefixes", () => {
    expect(isOnTrack("", "パーセント")).toBe(true);
    expect(isOnTrack("パー", "パーセント")).toBe(true);
  });

  it("ignores a mid-syllable romaji tail", () => {
    expect(isOnTrack("パーs", "パーセント")).toBe(true);
  });

  it("rejects input that diverged from the target", () => {
    expect(isOnTrack("バナナ", "パーセント")).toBe(false);
  });
});
