import { act, render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import { IsReadyContext } from "@/kanji-worker/kanji-worker-hooks";
import { useKanjiReadingDetails } from "./kanji-reading-category-hooks";
import { useMultiKanjiStructure } from "./multiple-kanji-structure-hooks";

/**
 * Both hooks replaced main-thread fetch-all providers with a worker request.
 * The sections that consume them predate the worker's status vocabulary, so
 * these tests pin the status strings as well as the data.
 */

vi.mock("@/kanji-worker/kanji-worker-promise-wrapper", () => ({
  default: { request: vi.fn(), terminate: vi.fn() },
}));

const request = vi.mocked(KANJI_WORKER_SINGLETON.request);

const Wrapper = ({
  children,
  ready = true,
}: {
  children: ReactNode;
  ready?: boolean;
}) => (
  <IsReadyContext.Provider value={ready}>{children}</IsReadyContext.Provider>
);

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => {
  request.mockReset();
});

describe("useMultiKanjiStructure", () => {
  const Probe = ({ kanji }: { kanji: string }) => {
    const { status, kanjiStructureData } = useMultiKanjiStructure(kanji);
    return (
      <div>
        <span data-testid="status">{status}</span>
        <span data-testid="scott">
          {kanjiStructureData?.scott?.join("") ?? "none"}
        </span>
      </div>
    );
  };

  const structures = {
    朝: {
      hlorenzi: { type: "kaii" as const },
      kanjium: null,
      scott: ["龺", "月"],
      yagays: null,
    },
  };

  it("asks the worker once and picks the requested kanji out of the map", async () => {
    request.mockResolvedValue(structures);

    render(
      <Wrapper>
        <Probe kanji="朝" />
      </Wrapper>
    );
    await flush();

    expect(request).toHaveBeenCalledWith({ type: "structures-map" });
    expect(request).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("scott").textContent).toBe("龺月");
    expect(screen.getByTestId("status").textContent).toBe("success");
  });

  it('reports "pending" while loading, not "loading"', async () => {
    // StructuralSection renders "..." for pending and <NoInfo/> otherwise, so
    // leaking useWorkerQuery's own wording would flash "no info" on every open.
    request.mockReturnValue(new Promise(() => {}));

    render(
      <Wrapper>
        <Probe kanji="朝" />
      </Wrapper>
    );

    expect(screen.getByTestId("status").textContent).toBe("pending");
  });

  it("returns null for a kanji the dataset does not cover", async () => {
    request.mockResolvedValue(structures);

    render(
      <Wrapper>
        <Probe kanji="一" />
      </Wrapper>
    );
    await flush();

    expect(screen.getByTestId("scott").textContent).toBe("none");
  });

  it("does not request anything before the worker is ready", async () => {
    request.mockResolvedValue(structures);

    render(
      <Wrapper ready={false}>
        <Probe kanji="朝" />
      </Wrapper>
    );
    await flush();

    expect(request).not.toHaveBeenCalled();
    expect(screen.getByTestId("status").textContent).toBe("idle");
  });
});

describe("useKanjiReadingDetails", () => {
  const Probe = ({ kanji }: { kanji: string }) => {
    const { status, kanjiReadingData } = useKanjiReadingDetails(kanji);
    return (
      <div>
        <span data-testid="status">{status}</span>
        <span data-testid="readings">
          {kanjiReadingData == null
            ? "none"
            : kanjiReadingData.map((entry) => entry.reading).join(",")}
        </span>
      </div>
    );
  };

  it("returns the expanded reading entries for the kanji", async () => {
    request.mockResolvedValue({
      朝: [
        {
          reading: "チョウ",
          type: "ON",
          frequency: "↔",
          example_word: "朝食",
        },
        { reading: "あさ", type: "KUN", frequency: "↑", example_word: "朝" },
      ],
    });

    render(
      <Wrapper>
        <Probe kanji="朝" />
      </Wrapper>
    );
    await flush();

    expect(request).toHaveBeenCalledWith({ type: "reading-details-map" });
    expect(screen.getByTestId("readings").textContent).toBe("チョウ,あさ");
  });

  it("treats an empty entry list as no data", async () => {
    // 292 of 2,426 kanji have no reading breakdown; an empty array would render
    // an empty table instead of the "no info" state.
    request.mockResolvedValue({ 朝: [] });

    render(
      <Wrapper>
        <Probe kanji="朝" />
      </Wrapper>
    );
    await flush();

    expect(screen.getByTestId("readings").textContent).toBe("none");
  });
});
