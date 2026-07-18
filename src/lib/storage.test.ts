import { describe, expect, it, vi } from "vitest";
import { notifyStorage, safeReadJson } from "./storage";

describe("safeReadJson", () => {
  it("returns the parsed value for valid JSON", () => {
    localStorage.setItem("k", JSON.stringify({ a: 1 }));
    expect(safeReadJson("k", { a: 0 })).toEqual({ a: 1 });
  });

  it("returns the fallback when the key is missing", () => {
    expect(safeReadJson("missing", "fallback")).toBe("fallback");
  });

  it("returns the fallback for corrupt JSON", () => {
    localStorage.setItem("k", "{not json");
    expect(safeReadJson("k", 42)).toBe(42);
  });
});

describe("notifyStorage", () => {
  it("dispatches a StorageEvent with the given key to window listeners", () => {
    const listener = vi.fn();
    window.addEventListener("storage", listener);
    try {
      notifyStorage("some-key");
      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as StorageEvent;
      expect(event.key).toBe("some-key");
    } finally {
      window.removeEventListener("storage", listener);
    }
  });
});
