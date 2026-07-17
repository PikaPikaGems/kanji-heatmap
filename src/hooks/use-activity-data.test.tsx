import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { recordActivity } from "@/lib/activity";
import { useActivityData } from "./use-activity-data";

describe("useActivityData", () => {
  it("returns an empty snapshot when nothing is recorded", () => {
    const { result } = renderHook(() => useActivityData());

    expect(result.current.daysActive).toBe(0);
    expect(result.current.allTime.recognitionRounds ?? 0).toBe(0);
    expect(result.current.byDay).toEqual({});
  });

  it("refreshes when activity is recorded (via notifyStorage)", () => {
    const { result } = renderHook(() => useActivityData());

    act(() => {
      recordActivity("recognition");
    });

    expect(result.current.allTime.recognitionRounds).toBe(1);
    expect(result.current.daysActive).toBe(1);
    expect(result.current.recognitionDays).toBe(1);

    act(() => {
      recordActivity("recognition");
      recordActivity("speedKatakana");
    });

    expect(result.current.allTime.recognitionRounds).toBe(2);
    expect(result.current.allTime.speedKatakanaSessions).toBe(1);
    expect(result.current.daysActive).toBe(1); // same local day
  });
});
