import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

/**
 * jsdom has no ResizeObserver, and virtua needs one to measure items. The stub
 * never fires, so a virtualised list falls back to its initial estimate — which
 * is enough to assert that it mounts a small window of a large list rather than
 * all of it.
 */
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

afterEach(() => {
  // RTL auto-cleanup requires test globals, which are disabled.
  cleanup();
  localStorage.clear();
});
