import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { decodeFurigana, encodeFurigana, WordPartDetail } from "./furigana";

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

describe("round-trip over the real vocabulary corpus", () => {
  // The generator rewrites every word in the corpus through encodeFurigana.
  // If any word fails to round-trip, that word's furigana silently changes in
  // the UI — so the whole corpus is the test case, not a sample of it.
  const furigana = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "raw-data", "vocab_furigana.json"),
      "utf8"
    )
  ) as Record<string, WordPartDetail[]>;

  const words = Object.keys(furigana);

  it("covers the whole corpus", () => {
    expect(words.length).toBeGreaterThan(4000);
  });

  it("round-trips every single word", () => {
    const failures: string[] = [];

    for (const word of words) {
      // Normalize first: the source stores a missing reading as an explicit
      // `undefined` second element in some entries and omits it in others.
      const expected: WordPartDetail[] = furigana[word].map((part) =>
        part[1] != null ? [part[0], part[1]] : [part[0]]
      );

      const actual = decodeFurigana(encodeFurigana(furigana[word]));
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        failures.push(
          `${word}: ${JSON.stringify(expected)} -> ${JSON.stringify(actual)}`
        );
      }
    }

    expect(failures).toEqual([]);
  });

  it("reconstructs the surface form of every word from its segments", () => {
    const mismatches: string[] = [];

    for (const word of words) {
      const surface = decodeFurigana(encodeFurigana(furigana[word]))
        .map(([text]) => text)
        .join("");
      // A handful of dictionary entries legitimately differ from the joined
      // segments; the invariant we care about is that encoding never changes
      // whatever the source produced.
      const sourceSurface = furigana[word].map(([text]) => text).join("");
      if (surface !== sourceSurface) {
        mismatches.push(`${word}: ${sourceSurface} -> ${surface}`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});
