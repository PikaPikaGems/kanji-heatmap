import { act, render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  IsReadyContext,
  useKanjiSearch,
} from "@/kanji-worker/kanji-worker-hooks";
import { SearchSettings } from "@/lib/settings/settings";

vi.mock("@/kanji-worker/kanji-worker-promise-wrapper", () => ({
  default: { request: vi.fn(), terminate: vi.fn() },
}));

const request = vi.mocked(KANJI_WORKER_SINGLETON.request);

const settings = (text: string): SearchSettings =>
  ({
    textSearch: { type: "keyword", text },
    filterSettings: {
      strokeRange: { min: 1, max: 99 },
      jlpt: [],
      jouyouGrade: [],
      freq: { source: "none", rankRange: { min: 1, max: 99999 } },
      bookmarkedOnly: false,
      withAnchorWordsOnly: false,
    },
    sortSettings: { primary: "none", secondary: "none" },
  }) as SearchSettings;

const Ready = ({ children }: { children: ReactNode }) => (
  <IsReadyContext.Provider value={true}>{children}</IsReadyContext.Provider>
);

/** Renders whatever useKanjiSearch currently reports, for assertion. */
const SearchProbe = ({
  searchSettings,
}: {
  searchSettings: SearchSettings;
}) => {
  const { status, data } = useKanjiSearch(searchSettings);
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="results">{(data ?? []).join(",")}</span>
    </div>
  );
};

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe("useKanjiSearch result cache", () => {
  beforeEach(() => {
    request.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows results once the worker answers", async () => {
    request.mockResolvedValue({ kanjis: ["水", "火"] });

    render(
      <Ready>
        <SearchProbe searchSettings={settings("unique-a")} />
      </Ready>
    );
    await flush();

    expect(screen.getByTestId("status").textContent).toBe("success");
    expect(screen.getByTestId("results").textContent).toBe("水,火");
  });

  it("renders a remount from cache without a loading state", async () => {
    // This is the route-change case: leaving the list screen and coming back
    // used to re-show the loading skeleton for an already-computed result.
    request.mockResolvedValue({ kanjis: ["山"] });

    const view = render(
      <Ready>
        <SearchProbe searchSettings={settings("unique-b")} />
      </Ready>
    );
    await flush();
    expect(request).toHaveBeenCalledTimes(1);

    view.unmount();

    render(
      <Ready>
        <SearchProbe searchSettings={settings("unique-b")} />
      </Ready>
    );

    // KanjiListWithSearch shows <LoadingKanjis/> whenever data is null, so
    // having data on the very first render after remount is what removes the
    // flash. The query still revalidates in the background.
    expect(screen.getByTestId("results").textContent).toBe("山");
  });

  it("still queries the worker when the settings differ", async () => {
    request.mockResolvedValue({ kanjis: ["川"] });

    render(
      <Ready>
        <SearchProbe searchSettings={settings("unique-c")} />
      </Ready>
    );
    await flush();
    expect(request).toHaveBeenCalledTimes(1);

    render(
      <Ready>
        <SearchProbe searchSettings={settings("unique-d")} />
      </Ready>
    );
    await flush();

    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not run a query before the worker is ready", async () => {
    request.mockResolvedValue({ kanjis: [] });

    render(
      <IsReadyContext.Provider value={false}>
        <SearchProbe searchSettings={settings("unique-e")} />
      </IsReadyContext.Provider>
    );
    await flush();

    expect(request).not.toHaveBeenCalled();
    expect(screen.getByTestId("status").textContent).toBe("idle");
  });
});
