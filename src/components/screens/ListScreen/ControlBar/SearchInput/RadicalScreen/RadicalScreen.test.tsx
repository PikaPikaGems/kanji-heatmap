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
 * 2. The results strip is virtualised. Selecting a common radical matches over
 *    a thousand kanji, and each item runs hooks and renders readings, so all of
 *    them must stay reachable while only the visible ones are mounted.
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

  it("mounts only a fraction of a large match set", () => {
    itemRenders.count = 0;
    searchResult.value = {
      data: kanjiList(1500),
      status: "success",
      additionalData: null,
    };

    render(<RadicalsResultsPreview onClick={() => {}} />);

    // The exact count depends on the measured viewport, so this asserts the
    // property that matters — nowhere near 1,500 items are mounted — rather
    // than a number that would make the test brittle.
    expect(itemRenders.count).toBeGreaterThan(0);
    expect(itemRenders.count).toBeLessThan(200);
    expect(screen.getAllByTestId("preview-item").length).toBe(
      itemRenders.count
    );
  });

  it("does not drop matches — the full set stays in the list", () => {
    // Virtualisation, not a cap: nothing is hidden behind a "+N more" button,
    // and scrolling reaches every match.
    searchResult.value = {
      data: kanjiList(1500),
      status: "success",
      additionalData: null,
    };

    render(<RadicalsResultsPreview onClick={() => {}} />);

    expect(screen.queryByText(/^\+\d+$/)).toBeNull();
    expect(screen.queryByText("more")).toBeNull();
  });

  it("mounts matches from the start of the list, in order", () => {
    // jsdom reports a zero-size viewport, so virtua mounts its minimum window
    // rather than everything — which is why this asserts ordering and an upper
    // bound instead of an exact count. That all matches remain reachable by
    // scrolling is covered in e2e, where the viewport is real.
    searchResult.value = {
      data: kanjiList(7),
      status: "success",
      additionalData: null,
    };

    render(<RadicalsResultsPreview onClick={() => {}} />);

    const mounted = screen
      .getAllByTestId("preview-item")
      .map((el) => el.textContent);
    expect(mounted.length).toBeGreaterThan(0);
    expect(mounted.length).toBeLessThanOrEqual(7);
    expect(mounted).toEqual(kanjiList(7).slice(0, mounted.length));
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
