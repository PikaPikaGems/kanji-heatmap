import { describe, expect, it } from "vitest";

import { decodeFurigana, encodeFurigana } from "./furigana";

describe("encodeFurigana", () => {
  it("writes a reading in brackets after its text", () => {
    expect(
      encodeFurigana([
        ["会", "かい"],
        ["社", "しゃ"],
      ])
    ).toBe("会[かい]社[しゃ]");
  });

  it("leaves plain segments untouched", () => {
    expect(encodeFurigana([["ひらがな"]])).toBe("ひらがな");
  });

  it("separates a bracketed segment from a preceding plain one", () => {
    expect(encodeFurigana([["あん"], ["肝", "きも"]])).toBe("あん 肝[きも]");
    expect(encodeFurigana([["お"], ["兄", "にい"], ["ちゃん"]])).toBe(
      "お 兄[にい]ちゃん"
    );
  });

  it("does not separate two bracketed segments", () => {
    expect(
      encodeFurigana([
        ["今", "こん"],
        ["日", "にち"],
      ])
    ).toBe("今[こん]日[にち]");
  });

  it("encodes an empty word as an empty string", () => {
    expect(encodeFurigana([])).toBe("");
  });

  it("rejects segments containing format delimiters", () => {
    expect(() => encodeFurigana([["a b"]])).toThrow(/delimiters/);
    expect(() => encodeFurigana([["x", "a]b"]])).toThrow(/delimiters/);
  });
});

describe("decodeFurigana", () => {
  it("reverses each encoding shape", () => {
    expect(decodeFurigana("会[かい]社[しゃ]")).toEqual([
      ["会", "かい"],
      ["社", "しゃ"],
    ]);
    expect(decodeFurigana("あん 肝[きも]")).toEqual([["あん"], ["肝", "きも"]]);
    expect(decodeFurigana("お 兄[にい]ちゃん")).toEqual([
      ["お"],
      ["兄", "にい"],
      ["ちゃん"],
    ]);
  });

  it("decodes an empty string to no segments", () => {
    expect(decodeFurigana("")).toEqual([]);
  });

  it("keeps an explicitly empty reading distinct from no reading", () => {
    expect(decodeFurigana("見[]")).toEqual([["見", ""]]);
    expect(decodeFurigana("見")).toEqual([["見"]]);
  });
});
