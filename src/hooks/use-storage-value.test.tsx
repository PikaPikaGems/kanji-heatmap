import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { notifyStorage } from "@/lib/storage";
import { useStorageValue } from "./use-storage-value";

const readCount = () => Number(localStorage.getItem("count") ?? "0");
const matchesCount = (key: string | null) => key === "count";

describe("useStorageValue", () => {
  it("reads the initial value", () => {
    localStorage.setItem("count", "5");

    const { result } = renderHook(() =>
      useStorageValue(readCount, matchesCount)
    );

    expect(result.current).toBe(5);
  });

  it("re-reads when a matching storage event fires", () => {
    const { result } = renderHook(() =>
      useStorageValue(readCount, matchesCount)
    );
    expect(result.current).toBe(0);

    act(() => {
      localStorage.setItem("count", "7");
      notifyStorage("count");
    });

    expect(result.current).toBe(7);
  });

  it("ignores non-matching storage events", () => {
    const { result } = renderHook(() =>
      useStorageValue(readCount, matchesCount)
    );

    act(() => {
      localStorage.setItem("count", "7");
      notifyStorage("something-else");
    });

    expect(result.current).toBe(0);
  });

  it("passes a null key through to matchesKey (storage.clear())", () => {
    localStorage.setItem("count", "3");
    const { result } = renderHook(() =>
      useStorageValue(readCount, (key) => key === null || key === "count")
    );
    expect(result.current).toBe(3);

    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });

    expect(result.current).toBe(0);
  });

  it("uses the latest inline callbacks without re-subscribing", () => {
    const addListener = vi.spyOn(window, "addEventListener");

    const { result, rerender } = renderHook(
      ({ factor }: { factor: number }) =>
        useStorageValue(() => readCount() * factor, matchesCount),
      { initialProps: { factor: 1 } }
    );

    const initialStorageSubscriptions = addListener.mock.calls.filter(
      ([type]) => type === "storage"
    ).length;

    rerender({ factor: 10 });

    act(() => {
      localStorage.setItem("count", "4");
      notifyStorage("count");
    });

    expect(result.current).toBe(40);
    const finalStorageSubscriptions = addListener.mock.calls.filter(
      ([type]) => type === "storage"
    ).length;
    expect(finalStorageSubscriptions).toBe(initialStorageSubscriptions);

    addListener.mockRestore();
  });
});
