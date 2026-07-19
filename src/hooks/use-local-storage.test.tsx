import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLocalStorage, useLocalStorageFlag } from "./use-local-storage";

type Settings = { a: number; b?: string };

describe("useLocalStorage", () => {
  it("seeds storage with the default value on first read", () => {
    const { result } = renderHook(() =>
      useLocalStorage<Settings>("settings", { a: 1 })
    );

    expect(result.current[0]).toEqual({ a: 1 });
    expect(JSON.parse(localStorage.getItem("settings")!)).toEqual({ a: 1 });
  });

  it("reads an existing stored value instead of the default", () => {
    localStorage.setItem("settings", JSON.stringify({ a: 5 }));

    const { result } = renderHook(() =>
      useLocalStorage<Settings>("settings", { a: 1 })
    );

    expect(result.current[0]).toEqual({ a: 5 });
  });

  it("setItem merges the key into the stored object and persists", () => {
    const { result } = renderHook(() =>
      useLocalStorage<Settings>("settings", { a: 1 })
    );

    act(() => {
      result.current[1]("b", "hello");
    });

    expect(result.current[0]).toEqual({ a: 1, b: "hello" });
    expect(JSON.parse(localStorage.getItem("settings")!)).toEqual({
      a: 1,
      b: "hello",
    });
  });

  it("keeps two hook instances on the same key in sync", () => {
    const first = renderHook(() =>
      useLocalStorage<Settings>("settings", { a: 1 })
    );
    const second = renderHook(() =>
      useLocalStorage<Settings>("settings", { a: 1 })
    );

    act(() => {
      first.result.current[1]("a", 99);
    });

    expect(first.result.current[0]).toEqual({ a: 99 });
    expect(second.result.current[0]).toEqual({ a: 99 });
  });

  it("does not react to writes on other keys", () => {
    const { result } = renderHook(() =>
      useLocalStorage<Settings>("settings", { a: 1 })
    );
    const other = renderHook(() =>
      useLocalStorage<Settings>("other", { a: 7 })
    );

    act(() => {
      other.result.current[1]("a", 8);
    });

    expect(result.current[0]).toEqual({ a: 1 });
  });
});

describe("useLocalStorageFlag", () => {
  it("defaults to false when unset", () => {
    const { result } = renderHook(() => useLocalStorageFlag("flag"));
    expect(result.current[0]).toBe(false);
  });

  it("stores 'true' when set and removes the key when unset", () => {
    const { result } = renderHook(() => useLocalStorageFlag("flag"));

    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem("flag")).toBe("true");

    act(() => {
      result.current[1](false);
    });
    expect(result.current[0]).toBe(false);
    expect(localStorage.getItem("flag")).toBeNull();
  });

  it("re-reads when the storage key changes", () => {
    localStorage.setItem("flag-a", "true");

    const { result, rerender } = renderHook(
      ({ key }: { key: string }) => useLocalStorageFlag(key),
      { initialProps: { key: "flag-a" } }
    );
    expect(result.current[0]).toBe(true);

    rerender({ key: "flag-b" });
    expect(result.current[0]).toBe(false);
  });
});
