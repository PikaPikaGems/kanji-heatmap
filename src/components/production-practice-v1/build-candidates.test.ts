import { describe, expect, it } from "vitest";
import { buildCandidateGrid } from "./build-candidates";
import {
  CANDIDATE_COUNT,
  MODEL_SEED_COUNT,
  SIMILAR_SEED_COUNT,
} from "./constants";

const allReal = () => true;

const build = (overrides: Partial<Parameters<typeof buildCandidateGrid>[0]>) =>
  buildCandidateGrid({
    target: "T",
    modelGuesses: [],
    similars: [],
    randomPool: [],
    isRealKanji: allReal,
    ...overrides,
  });

describe("buildCandidateGrid", () => {
  it("splits into the configured model/similar quotas when both pools are large", () => {
    const modelGuesses = Array.from(
      { length: MODEL_SEED_COUNT + 3 },
      (_, i) => `M${i + 1}`
    );
    const similars = Array.from(
      { length: SIMILAR_SEED_COUNT + 3 },
      (_, i) => `S${i + 1}`
    );

    const grid = build({ modelGuesses, similars });

    expect(grid).toHaveLength(CANDIDATE_COUNT);
    expect(new Set(grid).size).toBe(CANDIDATE_COUNT);
    expect(grid).toContain("T");

    const modelHits = grid.filter((k) => k.startsWith("M"));
    const similarHits = grid.filter((k) => k.startsWith("S"));
    expect(modelHits).toHaveLength(MODEL_SEED_COUNT);
    expect(similarHits).toHaveLength(SIMILAR_SEED_COUNT);
    // Quota is filled from the front of each ranked list.
    expect(modelHits.sort()).toEqual(
      modelGuesses.slice(0, MODEL_SEED_COUNT).sort()
    );
    expect(similarHits.sort()).toEqual(
      similars.slice(0, SIMILAR_SEED_COUNT).sort()
    );
  });

  it("backfills from a pool's own overflow when the other pool falls short of its quota", () => {
    const modelGuesses = Array.from({ length: 10 }, (_, i) => `M${i + 1}`);
    const similars = ["S1", "S2"]; // short of SIMILAR_SEED_COUNT

    const grid = build({ modelGuesses, similars });

    expect(grid).toHaveLength(CANDIDATE_COUNT);
    expect(grid).toEqual(expect.arrayContaining(["T", "S1", "S2"]));
    // 1 target + 2 similars leaves 9 slots for model guesses (more than its quota).
    const modelHits = grid.filter((k) => k.startsWith("M"));
    expect(modelHits).toHaveLength(CANDIDATE_COUNT - 1 - similars.length);
  });

  it("does not let a kanji shared by both pools double-count against either quota", () => {
    const modelGuesses = ["M1", "X"];
    const similars = ["X", "S1", "S2", "S3", "S4", "S5", "S6"];

    const grid = build({
      modelGuesses,
      similars,
      randomPool: ["P1", "P2", "P3"],
    });

    expect(new Set(grid).size).toBe(grid.length);
    expect(grid).toEqual(
      expect.arrayContaining([
        "T",
        "M1",
        "X",
        "S1",
        "S2",
        "S3",
        "S4",
        "S5",
        "S6",
      ])
    );
  });

  it("falls back to related lookalikes then the random pool when both seed pools are empty", () => {
    const grid = build({
      getSimilars: (k) => (k === "T" ? ["R1", "R2"] : []),
      randomPool: Array.from({ length: 20 }, (_, i) => `P${i + 1}`),
    });

    expect(grid).toHaveLength(CANDIDATE_COUNT);
    expect(grid).toEqual(expect.arrayContaining(["T", "R1", "R2"]));
    expect(new Set(grid).size).toBe(CANDIDATE_COUNT);
  });

  it("drops candidates that fail the real-kanji check", () => {
    const grid = build({
      modelGuesses: ["not-real", "M1"],
      isRealKanji: (k) => k !== "not-real",
      randomPool: ["P1", "P2"],
    });

    expect(grid).not.toContain("not-real");
    expect(grid).toEqual(expect.arrayContaining(["T", "M1"]));
  });

  it("always force-includes the target even if it fails the real-kanji check", () => {
    const grid = build({ isRealKanji: () => false, randomPool: ["P1"] });
    expect(grid).toContain("T");
  });
});
