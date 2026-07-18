import { describe, expect, it } from "vitest";
import {
  CommonWordEntry,
  scoreWordEntry,
  sortWordData,
  toCommonWordEntries,
} from "./sample-vocabulary";

describe("scoreWordEntry", () => {
  it("scores Kaishi membership highest", () => {
    expect(scoreWordEntry({ w: "水", k: true })).toBe(500);
    expect(scoreWordEntry({ w: "水", k: 1 })).toBe(500);
    expect(scoreWordEntry({ w: "水", k: 0 })).toBe(0);
  });

  it("scores easier JLPT levels higher", () => {
    expect(scoreWordEntry({ w: "水", j: 5 })).toBe(250);
    expect(scoreWordEntry({ w: "水", j: 1 })).toBe(20);
    expect(scoreWordEntry({ w: "水" })).toBe(0);
  });

  it("scores frequency tiers, treating unknown tiers as unranked", () => {
    expect(scoreWordEntry({ w: "水", t: "🌱" })).toBe(250);
    expect(scoreWordEntry({ w: "水", t: "📚" })).toBe(10);
    expect(scoreWordEntry({ w: "水", t: "❓" })).toBe(0);
  });

  it("adds the three signals together", () => {
    expect(scoreWordEntry({ w: "水", k: true, j: 5, t: "🌱" })).toBe(1000);
  });
});

describe("sortWordData", () => {
  it("orders beginner-friendliest words first without mutating input", () => {
    const advanced: CommonWordEntry = { w: "難", j: 1, t: "🌶️" };
    const beginner: CommonWordEntry = { w: "水", k: true, j: 5, t: "🌱" };
    const middle: CommonWordEntry = { w: "中", j: 3, t: "☘️" };
    const input = [advanced, beginner, middle];

    const sorted = sortWordData(input);

    expect(sorted.map((e) => e.w)).toEqual(["水", "中", "難"]);
    expect(input.map((e) => e.w)).toEqual(["難", "水", "中"]);
  });
});

describe("toCommonWordEntries", () => {
  it("maps textbook tuples into CommonWordEntry shape", () => {
    expect(
      toCommonWordEntries({
        犬小屋: ["いぬごや", "doghouse", 5, "kaishi, alt"],
      })
    ).toEqual([
      {
        w: "犬小屋",
        r: "いぬごや",
        e: "doghouse",
        j: 5,
        k: true,
        uncommon_form: true,
      },
    ]);
  });

  it("defaults missing jlpt/tags", () => {
    const [entry] = toCommonWordEntries({ 水: ["みず", "water"] });
    expect(entry.k).toBe(false);
    expect(entry.uncommon_form).toBe(false);
    expect(Number.isNaN(entry.j)).toBe(true);
  });
});
