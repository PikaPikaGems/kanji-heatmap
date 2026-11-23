import { act, render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  AnchorIndexContext,
  IsReadyContext,
} from "@/kanji-worker/kanji-worker-hooks";
import type { AnchorIndex } from "@/lib/kanji/anchor-words";
import {
  useKanjiAnchorWords,
  useKanjiRepresentativeWord,
} from "./kanji-representative-word-hooks";

vi.mock("@/kanji-worker/kanji-worker-promise-wrapper", () => ({
  default: { request: vi.fn(), terminate: vi.fn() },
}));

const request = vi.mocked(KANJI_WORKER_SINGLETON.request);

// The anchor index as the provider holds it: 亜 has no anchor word.
const anchorIndex: AnchorIndex = {
  車: { word: "車", reading: "くるま", secondary: "電車" },
};

const Wrapper = ({ children }: { children: ReactNode }) => (
  <IsReadyContext.Provider value={true}>
    <AnchorIndexContext.Provider value={anchorIndex}>
      {children}
    </AnchorIndexContext.Provider>
  </IsReadyContext.Provider>
);

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue({
    main: {
      word: "車",
      readings: ["くるま"],
      englishGloss: "car, vehicle",
      tags: ["n5"],
      ranks: [],
      tier: "🌱",
    },
    secondary: {
      word: "電車",
      readings: ["でんしゃ"],
      englishGloss: "train",
      tags: [],
      ranks: [],
      tier: "🌱",
    },
  });
});

describe("useKanjiRepresentativeWord", () => {
  const Probe = ({ kanji }: { kanji: string }) => {
    const data = useKanjiRepresentativeWord(kanji);
    return (
      <span data-testid="out">
        {data ? `${data.word}/${data.reading}` : "none"}
      </span>
    );
  };

  it("reads the word and reading straight from the anchor index", () => {
    render(
      <Wrapper>
        <Probe kanji="車" />
      </Wrapper>
    );

    // No awaiting: expanded tiles render this during render.
    expect(screen.getByTestId("out").textContent).toBe("車/くるま");
  });

  it("returns null while the anchor index is loading", () => {
    render(
      <IsReadyContext.Provider value={true}>
        <Probe kanji="車" />
      </IsReadyContext.Provider>
    );

    expect(screen.getByTestId("out").textContent).toBe("none");
  });

  it("returns null for a kanji with no representative word", () => {
    render(
      <Wrapper>
        <Probe kanji="亜" />
      </Wrapper>
    );

    expect(screen.getByTestId("out").textContent).toBe("none");
  });

  it("never fetches the gloss dataset", async () => {
    render(
      <Wrapper>
        <Probe kanji="車" />
      </Wrapper>
    );
    await flush();

    // The grid renders thousands of these; pulling 60 KB of glosses for them
    // is exactly what this split avoids.
    expect(request).not.toHaveBeenCalled();
  });
});

describe("useKanjiAnchorWords", () => {
  const Probe = ({ kanji }: { kanji: string }) => {
    const data = useKanjiAnchorWords(kanji);
    if (data == null) return <span data-testid="out">none</span>;
    const { main, secondary } = data;
    return (
      <span data-testid="out">{`${main.word}|${main.englishGloss}|${main.tier}|${secondary?.word ?? "-"}`}</span>
    );
  };

  it("shows the main word immediately and fills in the rest when it arrives", async () => {
    render(
      <Wrapper>
        <Probe kanji="車" />
      </Wrapper>
    );

    expect(screen.getByTestId("out").textContent).toBe("車|||-");

    await flush();

    expect(screen.getByTestId("out").textContent).toBe(
      "車|car, vehicle|🌱|電車"
    );
    expect(request).toHaveBeenCalledWith({
      type: "kanji-anchor-words",
      payload: "車",
    });
  });

  it("stays null for a kanji with no main word, without asking the worker", async () => {
    render(
      <Wrapper>
        <Probe kanji="亜" />
      </Wrapper>
    );
    await flush();

    expect(screen.getByTestId("out").textContent).toBe("none");
    expect(request).not.toHaveBeenCalled();
  });
});
