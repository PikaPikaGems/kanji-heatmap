import { describe, expect, it } from "vitest";
import {
  parseChallengeParam,
  speedKatakanaChallengeHref,
} from "./challenge-search-param";

describe("parseChallengeParam", () => {
  it("accepts integers in 1..200", () => {
    expect(parseChallengeParam("1")).toBe(1);
    expect(parseChallengeParam("200")).toBe(200);
    expect(parseChallengeParam("42")).toBe(42);
  });

  it("rejects missing, empty, non-integer, and out-of-range values", () => {
    expect(parseChallengeParam(null)).toBeNull();
    expect(parseChallengeParam("")).toBeNull();
    expect(parseChallengeParam("abc")).toBeNull();
    expect(parseChallengeParam("1.5")).toBeNull();
    expect(parseChallengeParam("0")).toBeNull();
    expect(parseChallengeParam("201")).toBeNull();
    expect(parseChallengeParam("-3")).toBeNull();
  });
});

describe("speedKatakanaChallengeHref", () => {
  it("builds the deep link with the challenge query param", () => {
    expect(speedKatakanaChallengeHref(200)).toBe(
      "/speed-katakana?challenge=200"
    );
  });
});
