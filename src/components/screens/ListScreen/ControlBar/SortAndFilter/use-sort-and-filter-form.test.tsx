import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { SearchSettings } from "@/lib/settings/settings";
import {
  defaultFilterSettings,
  defaultSearchTextSettings,
  defaultSortSettings,
} from "@/lib/settings/search-settings-adapter";
import { useSortAndFilterForm } from "./use-sort-and-filter-form";

const initial: SearchSettings = {
  textSearch: defaultSearchTextSettings,
  filterSettings: defaultFilterSettings,
  sortSettings: defaultSortSettings,
};

describe("useSortAndFilterForm", () => {
  it("starts disabled (no changes) and enables after an edit", () => {
    const { result } = renderHook(() => useSortAndFilterForm(initial));
    expect(result.current.isDisabled).toBe(true);

    act(() => result.current.setJlpt(["n5"]));
    expect(result.current.isDisabled).toBe(false);
  });

  it("keeps the secondary sort when the new primary is a grouping sort", () => {
    const { result } = renderHook(() => useSortAndFilterForm(initial));

    act(() => result.current.setSecondarySort("rank-netflix"));
    act(() => result.current.setPrimarySort("jlpt"));

    expect(result.current.sortValues).toEqual({
      primary: "jlpt",
      secondary: "rank-netflix",
    });
    expect(result.current.isGroup).toBe(true);
  });

  it("resets the secondary when the primary is not a grouping sort", () => {
    const { result } = renderHook(() => useSortAndFilterForm(initial));

    act(() => result.current.setSecondarySort("rank-netflix"));
    act(() => result.current.setPrimarySort("rtk-index"));

    expect(result.current.sortValues.secondary).toBe("none");
    expect(result.current.isGroup).toBe(false);
  });

  it("resets the secondary when it collides with the new primary", () => {
    const { result } = renderHook(() => useSortAndFilterForm(initial));

    act(() => result.current.setSecondarySort("strokes"));
    act(() => result.current.setPrimarySort("strokes"));

    expect(result.current.sortValues.secondary).toBe("none");
  });

  it("snaps the rank range back to full when the freq source clears", () => {
    const { result } = renderHook(() => useSortAndFilterForm(initial));

    act(() => result.current.setFreqSource("rank-netflix"));
    act(() => result.current.setFreqRankRange([10, 500]));
    expect(result.current.filterValues.freq.rankRange).toEqual({
      min: 10,
      max: 500,
    });

    act(() => result.current.setFreqSource("none"));
    expect(result.current.filterValues.freq).toEqual(
      defaultFilterSettings.freq
    );
    expect(result.current.isDisabled).toBe(true);
  });

  it("resetToDefaults returns everything to the defaults", () => {
    const { result } = renderHook(() => useSortAndFilterForm(initial));

    act(() => result.current.setPrimarySort("jlpt"));
    act(() => result.current.setStrokeRange([3, 10]));
    act(() => result.current.resetToDefaults());

    expect(result.current.sortValues).toEqual(defaultSortSettings);
    expect(result.current.filterValues).toEqual(defaultFilterSettings);
  });

  it("buildSettings merges the edits over the initial settings", () => {
    const { result } = renderHook(() => useSortAndFilterForm(initial));

    act(() => result.current.setPrimarySort("jlpt"));

    const built = result.current.buildSettings();
    expect(built.textSearch).toEqual(initial.textSearch);
    expect(built.sortSettings.primary).toBe("jlpt");
  });
});
