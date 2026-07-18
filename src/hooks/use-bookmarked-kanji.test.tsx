import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { notifyStorage } from "@/lib/storage";
import {
  kanjiFromBookmarkKey,
  useBookmarkedKanji,
} from "./use-bookmarked-kanji";

describe("kanjiFromBookmarkKey", () => {
  it("parses the kanji out of a bookmark key", () => {
    expect(kanjiFromBookmarkKey("b:水:水道")).toBe("水");
  });

  it("returns null for keys without the bookmark prefix", () => {
    expect(kanjiFromBookmarkKey("x:水:水道")).toBeNull();
  });

  it("returns null for malformed keys", () => {
    expect(kanjiFromBookmarkKey("b:水")).toBeNull(); // no word separator
    expect(kanjiFromBookmarkKey("b::水道")).toBeNull(); // empty kanji
  });
});

describe("useBookmarkedKanji", () => {
  it("reads bookmarked kanji from storage on mount", () => {
    localStorage.setItem("b:水:水道", "true");
    localStorage.setItem("b:火:火事", "false"); // not bookmarked
    localStorage.setItem("unrelated", "true");

    const { result } = renderHook(() => useBookmarkedKanji());

    expect(result.current).toEqual(["水"]);
  });

  it("refreshes on a storage event for a bookmark key", () => {
    const { result } = renderHook(() => useBookmarkedKanji());
    expect(result.current).toEqual([]);

    act(() => {
      localStorage.setItem("b:火:火事", "true");
      notifyStorage("b:火:火事");
    });

    expect(result.current).toEqual(["火"]);
  });

  it("ignores storage events for unrelated keys", () => {
    const { result } = renderHook(() => useBookmarkedKanji());

    act(() => {
      // Written directly (no matching event fired), so a refresh would see it.
      localStorage.setItem("b:火:火事", "true");
      notifyStorage("unrelated-key");
    });

    expect(result.current).toEqual([]);
  });
});
