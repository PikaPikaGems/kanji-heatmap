import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { notifyStorage } from "@/lib/storage";
import { useCompletedSetsCount } from "./use-completed-sets-count";
import { STATS_KEY_PREFIX } from "./storage";

const seedSet = (setNumber: number) => {
  localStorage.setItem(
    `${STATS_KEY_PREFIX}${setNumber}`,
    JSON.stringify({ latestCpm: 100 })
  );
};

describe("useCompletedSetsCount", () => {
  it("counts sets with recorded stats on mount", () => {
    seedSet(1);
    seedSet(3);

    const { result } = renderHook(() => useCompletedSetsCount());

    expect(result.current).toBe(2);
  });

  it("refreshes on a storage event for a stats key", () => {
    const { result } = renderHook(() => useCompletedSetsCount());
    expect(result.current).toBe(0);

    act(() => {
      seedSet(2);
      notifyStorage(`${STATS_KEY_PREFIX}2`);
    });

    expect(result.current).toBe(1);
  });

  it("ignores storage events for unrelated keys", () => {
    const { result } = renderHook(() => useCompletedSetsCount());

    act(() => {
      seedSet(2); // written but no matching event
      notifyStorage("unrelated-key");
    });

    expect(result.current).toBe(0);
  });
});
