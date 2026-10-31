import { describe, expect, it } from "vitest";
import { buildPracticeDeck, withFreshFonts } from "./build-deck";
import type { AnchorWordBasics } from "@/lib/kanji/anchor-words";
import { DeckFilterSettings, PracticeItem } from "./types";

const word = (
  w: string,
  readings: string[],
  englishGloss: string
): AnchorWordBasics => ({ word: w, readings, englishGloss });

const repWords: Record<string, AnchorWordBasics> = {
  水: word("水道", ["すいどう"], "water supply"),
  火: word("火事", ["かじ"], "fire"),
  日: word("日本", ["にほん", "にっぽん"], "Japan"),
};

const defaultSettings: DeckFilterSettings = {
  jlpt: [],
  jouyouGrade: [],
  bookmarkedOnly: false,
  randomizeOrder: false,
  randomizeFont: false,
};

const build = (
  overrides: Partial<DeckFilterSettings> = {},
  words: Record<string, AnchorWordBasics> = repWords,
  includedKanji: ReadonlySet<string> = new Set(["水", "火", "日"])
) =>
  buildPracticeDeck({
    words,
    includedKanji,
    getKeyword: (kanji) => (kanji === "日" ? "" : `${kanji}-keyword`),
    settings: { ...defaultSettings, ...overrides },
  });

describe("buildPracticeDeck", () => {
  it("builds one item per entry, preserving order when not randomized", () => {
    const deck = build();
    expect(deck.map((item) => item.kanji)).toEqual(["水", "火", "日"]);
    expect(deck[0]).toEqual({
      kanji: "水",
      word: "水道",
      reading: "すいどう",
      englishGloss: "water supply",
      keyword: "水-keyword",
      fontIndex: null,
    });
  });

  it("skips invalid entries and kanji excluded by the worker filters", () => {
    const withBadEntries = {
      ...repWords,
      空: word("", ["そら"], "sky"), // missing word
      雨: word("雨", [], "rain"), // no reading
      鳥: word("小鳥", ["ことり"], "bird"),
    };

    const deck = build({}, withBadEntries);
    expect(deck.map((item) => item.kanji)).toEqual(["水", "火", "日"]);
  });

  it("keeps only kanji included by the worker search", () => {
    const deck = build({}, repWords, new Set(["水", "日"]));
    expect(deck.map((item) => item.kanji)).toEqual(["水", "日"]);
  });

  it("falls back to '...' when the keyword is empty", () => {
    const deck = build();
    expect(deck.find((item) => item.kanji === "日")?.keyword).toBe("...");
  });

  it("assigns a fontIndex to every item when randomizeFont is set", () => {
    const deck = build({ randomizeFont: true });
    expect(deck.every((item) => typeof item.fontIndex === "number")).toBe(true);
  });

  it("keeps the same members when randomizeOrder is set", () => {
    const deck = build({ randomizeOrder: true });
    expect(deck.map((item) => item.kanji).sort()).toEqual(["日", "水", "火"]);
  });
});

describe("withFreshFonts", () => {
  const items: PracticeItem[] = [
    {
      kanji: "水",
      word: "水道",
      reading: "すいどう",
      englishGloss: "",
      keyword: "water",
      fontIndex: 3,
    },
  ];

  it("clears fontIndex when randomizeFont is off", () => {
    expect(withFreshFonts(items, false)[0].fontIndex).toBeNull();
  });

  it("assigns a numeric fontIndex when randomizeFont is on", () => {
    expect(typeof withFreshFonts(items, true)[0].fontIndex).toBe("number");
  });
});
