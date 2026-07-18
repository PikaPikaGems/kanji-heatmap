import { describe, expect, it } from "vitest";
import {
  formatModelLoadErrorReport,
  isOrtWasmOutOfMemoryError,
} from "./format-model-load-error";

describe("isOrtWasmOutOfMemoryError", () => {
  it("detects the Safari WASM OOM shape from ORT", () => {
    expect(
      isOrtWasmOutOfMemoryError(
        new Error(
          "no available backend found. ERR: [wasm] RangeError: Out of memory, [cpu] Error: previous call to 'initWasm()' failed."
        )
      )
    ).toBe(true);
  });

  it("detects OOM text inside a formatted error report", () => {
    expect(
      isOrtWasmOutOfMemoryError(
        "DaKanji model warmup failed\nmessage: RangeError: Out of memory"
      )
    ).toBe(true);
  });

  it("is false for unrelated failures", () => {
    expect(
      isOrtWasmOutOfMemoryError(new Error("Failed to load DaKanji labels: 404"))
    ).toBe(false);
    expect(
      isOrtWasmOutOfMemoryError(
        new Error("no available backend found. ERR: [wasm] failed to fetch")
      )
    ).toBe(false);
  });
});

describe("formatModelLoadErrorReport", () => {
  it("includes the pinned ORT runtime note", () => {
    const report = formatModelLoadErrorReport(new Error("boom"));
    expect(report).toContain("DaKanji model warmup failed");
    expect(report).toContain("message: boom");
    expect(report).toContain(
      "ort: onnxruntime-web@1.17.3 (wasm numThreads=1 simd=false)"
    );
  });
});
