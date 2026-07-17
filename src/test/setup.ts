import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  // RTL auto-cleanup requires test globals, which are disabled.
  cleanup();
  localStorage.clear();
});
