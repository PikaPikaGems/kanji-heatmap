import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { RadicalScreenContent, RadicalsResultsPreview } from "./RadicalScreen";

/**
 * The radical drawer's cost is main-thread rendering, not search. Two things
 * keep it responsive and neither is visible from reading the JSX:
 *
 * 1. RadicalBtn is memoised, which only works while `onToggle` keeps one
 *    identity. Reintroducing a per-button arrow function would re-render all
 *    253 buttons on every selection.
 * 2. The results strip is capped. Selecting a common radical matches over a
 *    thousand kanji, and each item runs hooks and renders readings.
 */

const searchResult = vi.hoisted(() => ({
  value: {
    data: null as string[] | null,
    status: "success" as string,
    additionalData: null as Set<string> | null,
  },
}));

vi.mock("@/kanji-worker/kanji-worker-hooks", () => ({
  useKanjiSearchResult: () => searchResult.value,
  useGetKanjiInfoFn: () => (kanji: string) => ({ keyword: `kw-${kanji}` }),
}));

vi.mock("@/hooks/use-is-touch-device", () => ({
  useIsTouchDevice: () => false,
}));

// Each preview item normally runs useItemBtnCn and renders ExpandedBtnContent;
// counting renders is the point here, so it is stubbed down to a marker.
const itemRenders = vi.hoisted(() => ({ count: 0 }));
vi.mock("@/components/sections/KanjiHoverItem/KanjiItemButton", () => ({
  KanjiItemSimpleButton: ({ kanji }: { kanji: string }) => {
    itemRenders.count += 1;
    return <span data-testid="preview-item">{kanji}</span>;
  },
}));

describe("RadicalScreenContent", () => {
  const Harness = () => {
    const [value, setValue] = useState<Set<string>>(new Set());
    return <RadicalScreenContent value={value} setValue={setValue} />;
  };

  it("toggles a radical on and back off", async () => {
    render(<Harness />);

    const ichi = screen.getAllByRole("button", { name: "一" })[0];
    await userEvent.click(ichi);
    // Selected buttons swap their dotted border for a filled pill.
    expect(ichi.className).toContain("bg-black");

    await userEvent.click(ichi);
    expect(ichi.className).not.toContain("bg-black");
  });

  it("disables radicals that cannot narrow the current results", () => {
    // possibleRadicals comes back with the search; anything outside it would
    // produce zero matches, so it is greyed out rather than clickable.
    searchResult.value = {
      data: null,
      status: "success",
      additionalData: new Set(["一"]),
    };

    render(<Harness />);

    expect(screen.getAllByRole("button", { name: "一" })[0]).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "水" })[0]).toBeDisabled();
  });

  it("keeps a selected radical clickable even once it stops narrowing", async () => {
    // Otherwise selecting a radical could disable the very button needed to
    // deselect it, and the user would be stuck with a filter they cannot undo.
    searchResult.value = {
      data: null,
      status: "success",
      additionalData: new Set(["一", "水"]),
    };

    const { rerender } = render(<Harness />);
    await userEvent.click(screen.getAllByRole("button", { name: "一" })[0]);

    // The search comes back narrower: neither radical would narrow further.
    searchResult.value = {
      data: null,
      status: "success",
      additionalData: new Set<string>(),
    };
    rerender(<Harness />);

    expect(screen.getAllByRole("button", { name: "一" })[0]).toBeEnabled();
    // 水 was never selected, so it does get disabled — proving the rerender
    // picked up the narrower result rather than the assertion above passing
    // by accident.
    expect(screen.getAllByRole("button", { name: "水" })[0]).toBeDisabled();
  });
});

describe("RadicalsResultsPreview", () => {
  const kanjiList = (n: number) =>
    Array.from({ length: n }, (_, i) => String.fromCodePoint(0x4e00 + i));

  it("caps how many matches it renders and reports the remainder", () => {
    itemRenders.count = 0;
    searchResult.value = {
      data: kanjiList(1500),
      status: "success",
      additionalData: null,
    };

    render(<RadicalsResultsPreview onClick={() => {}} />);

    // 120 items, not 1500 — the whole point of the cap.
    expect(screen.getAllByTestId("preview-item")).toHaveLength(120);
    expect(itemRenders.count).toBe(120);
    expect(screen.getByText("+1380")).toBeVisible();
  });

  it("renders every match when they fit under the cap", () => {
    searchResult.value = {
      data: kanjiList(7),
      status: "success",
      additionalData: null,
    };

    render(<RadicalsResultsPreview onClick={() => {}} />);

    expect(screen.getAllByTestId("preview-item")).toHaveLength(7);
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it("shows nothing when nothing is filtered out yet", () => {
    // An unfiltered result set means no radical has narrowed anything, so the
    // strip stays empty rather than rendering the entire kanji set.
    searchResult.value = {
      data: kanjiList(2426),
      status: "success",
      additionalData: null,
    };

    render(<RadicalsResultsPreview onClick={() => {}} />);

    expect(screen.queryAllByTestId("preview-item")).toHaveLength(0);
  });
});
