import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchSettings } from "@/lib/settings/settings";
import {
  defaultFilterSettings,
  defaultSearchTextSettings,
  defaultSortSettings,
} from "@/lib/settings/search-settings-adapter";

import { ItemCountBadge } from "./ItemCountBadge";

// 奄 is a pasted kanji we don't have: the worker never returns it, but with
// no filters the list still shows it as a tile.
const state = vi.hoisted(() => ({
  data: [] as string[],
  settings: null as SearchSettings | null,
}));

vi.mock("@/kanji-worker/kanji-worker-hooks", () => ({
  useKanjiSearchResult: () => ({ data: state.data, status: "success" }),
}));
vi.mock("@/providers/search-settings-hooks", () => ({
  useSearchSettings: () => state.settings,
}));
vi.mock("@/hooks/use-storage-value", () => ({ useStorageValue: () => 0 }));

const multiKanji = (strokeMax?: number): SearchSettings => ({
  textSearch: {
    ...defaultSearchTextSettings,
    type: "multi-kanji",
    text: "勿奄久",
  },
  filterSettings:
    strokeMax == null
      ? defaultFilterSettings
      : {
          ...defaultFilterSettings,
          strokeRange: { ...defaultFilterSettings.strokeRange, max: strokeMax },
        },
  sortSettings: defaultSortSettings,
});

describe("ItemCountBadge (multi-kanji)", () => {
  it("counts every pasted kanji when no filter is on, with no dot", () => {
    state.data = ["勿", "久"];
    state.settings = multiKanji();
    render(<ItemCountBadge />);
    expect(screen.getByText(/3 Items/)).toBeInTheDocument();
    expect(screen.queryByText(/hidden by filters/)).toBeNull();
  });

  it("counts only the tiles left by filters, with a dot", () => {
    state.data = ["久"];
    state.settings = multiKanji(3);
    render(<ItemCountBadge />);
    expect(screen.getByText(/1 Item\b/)).toBeInTheDocument();
    expect(screen.getByText(/hidden by filters/)).toBeInTheDocument();
  });
});
