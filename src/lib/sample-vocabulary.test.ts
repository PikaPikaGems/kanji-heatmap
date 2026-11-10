import { describe, expect, it } from "vitest";
import { toCommonWordEntries } from "./sample-vocabulary";

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
