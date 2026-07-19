import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { STATS_KEY_PREFIX } from "./storage";
import { CHALLENGES_PER_LEVEL, LEVELS } from "./constants";
import { useSpeedKatakanaProgress } from "./use-speed-katakana-progress";

const seedSet = (setNumber: number, latestCpm = 100) => {
  localStorage.setItem(
    `${STATS_KEY_PREFIX}${setNumber}`,
    JSON.stringify({ latestCpm })
  );
};

describe("useSpeedKatakanaProgress", () => {
  it("reports zero progress with no stored stats", () => {
    const { result } = renderHook(() => useSpeedKatakanaProgress());

    expect(result.current.summary.completed).toBe(0);
    expect(result.current.summary.averageCpm).toBe(null);
    expect(result.current.levelCompletion).toHaveLength(LEVELS);
    expect(result.current.levelCompletion.every((c) => c === 0)).toBe(true);
  });

  it("aggregates summary and per-level completion", () => {
    // Sets 1 and 2 live in level 1; the first set of level 2 comes right
    // after the level boundary.
    seedSet(1, 100);
    seedSet(2, 200);
    seedSet(CHALLENGES_PER_LEVEL + 1, 300);

    const { result } = renderHook(() => useSpeedKatakanaProgress());

    expect(result.current.summary.completed).toBe(3);
    expect(result.current.summary.averageCpm).toBe(200);
    expect(result.current.levelCompletion[0]).toBe(2);
    expect(result.current.levelCompletion[1]).toBe(1);
  });
});
