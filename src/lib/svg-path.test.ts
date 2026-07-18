import { describe, expect, it } from "vitest";
import { getSvgPathFromStroke } from "./svg-path";

describe("getSvgPathFromStroke", () => {
  it("returns an empty string for an empty stroke", () => {
    expect(getSvgPathFromStroke([])).toBe("");
  });

  it("builds a closed quadratic path, wrapping back to the first point", () => {
    const path = getSvgPathFromStroke([
      [0, 0],
      [10, 0],
    ]);
    // M start, Q pairs with midpoints (5,0 between the two, and back again),
    // closed with Z.
    expect(path).toBe("M 0 0 Q 0 0 5 0 10 0 5 0 Z");
  });
});
