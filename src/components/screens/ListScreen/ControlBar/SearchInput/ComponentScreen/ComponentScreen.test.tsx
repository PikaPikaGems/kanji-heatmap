import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ComponentScreenContent } from "./ComponentScreen";

/**
 * The drawer has ~980 buttons. A tap must re-render only the buttons whose
 * state changed, which holds while RadicalBtn stays memoised and the toggle
 * handler keeps one identity.
 */

const searchResult = vi.hoisted(() => ({
  value: { additionalData: null as Set<string> | null },
}));

vi.mock("@/kanji-worker/kanji-worker-hooks", () => ({
  useKanjiSearchResult: () => searchResult.value,
  useSphmnDrawer: () => ({
    status: "success",
    data: [
      ["口", 350, 3],
      ["一", 200, 1],
      ["寺", 8, 6],
    ],
  }),
}));

vi.mock("@/hooks/use-is-touch-device", () => ({
  useIsTouchDevice: () => false,
}));

// Same memo boundary as the real RadicalBtn, with a render counter inside.
const renders = vi.hoisted(() => new Map<string, number>());
vi.mock("../RadicalScreen/RadicalScreen", () => ({
  RadicalBtn: React.memo(function RadicalBtn({
    radical,
    isSelected,
    isDisabled,
    onToggle,
  }: {
    radical: string;
    isSelected: boolean;
    isDisabled: boolean;
    onToggle: (radical: string, e: React.MouseEvent<HTMLButtonElement>) => void;
  }) {
    renders.set(radical, (renders.get(radical) ?? 0) + 1);
    return (
      <button
        disabled={isDisabled}
        aria-pressed={isSelected}
        onClick={(e) => onToggle(radical, e)}
      >
        {radical}
      </button>
    );
  }),
}));

const Harness = () => {
  const [value, setValue] = useState<Set<string>>(new Set());
  return <ComponentScreenContent value={value} setValue={setValue} />;
};

describe("ComponentScreenContent", () => {
  const glyphs = () =>
    screen
      .getAllByRole("button")
      .map((b) => b.textContent)
      // Skip the bands switch, which is a button with no text.
      .filter((text) => text !== "");

  it("orders each band by stroke count, the plain list by matches", async () => {
    render(<Harness />);
    // Bands on: 口 and 一 share the 50+ band, so 一 (1 stroke) leads.
    expect(glyphs()).toEqual(["一", "口", "寺"]);

    await userEvent.click(screen.getByRole("switch", { name: /Group by/ }));
    expect(glyphs()).toEqual(["口", "一", "寺"]);
  });

  it("re-renders only the tapped button", async () => {
    renders.clear();
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "寺" }));

    expect(screen.getByRole("button", { name: "寺" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(renders.get("寺")).toBe(2);
    expect(renders.get("口")).toBe(1);
    expect(renders.get("一")).toBe(1);
  });

  it("disables components that cannot narrow the results", () => {
    searchResult.value = { additionalData: new Set(["口"]) };
    render(<Harness />);
    expect(screen.getByRole("button", { name: "口" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "寺" })).toBeDisabled();
    searchResult.value = { additionalData: null };
  });
});
