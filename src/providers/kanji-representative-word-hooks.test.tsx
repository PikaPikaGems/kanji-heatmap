import { act, render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import {
  GetBasicKanjiInfoContext,
  IsReadyContext,
} from "@/kanji-worker/kanji-worker-hooks";
import { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import {
  useKanjiRepresentativeWord,
  useKanjiRepresentativeWordDetails,
} from "./kanji-representative-word-hooks";

vi.mock("@/kanji-worker/kanji-worker-promise-wrapper", () => ({
  default: { request: vi.fn(), terminate: vi.fn() },
}));

const request = vi.mocked(KANJI_WORKER_SINGLETON.request);

// Only the fields the representative-word hooks read.
const getInfo = ((kanji: string) =>
  kanji === "車"
    ? { keyword: "car", repWord: "車", repReading: "くるま" }
    : kanji === "亜"
      ? { keyword: "rank", repWord: null, repReading: null }
      : null) as GetBasicKanjiInfo;

const Wrapper = ({ children }: { children: ReactNode }) => (
  <IsReadyContext.Provider value={true}>
    <GetBasicKanjiInfoContext.Provider value={getInfo}>
      {children}
    </GetBasicKanjiInfoContext.Provider>
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
  request.mockResolvedValue({ 車: ["car, vehicle", "🚗"] });
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

  it("reads the word and reading straight from the snapshot", () => {
    render(
      <Wrapper>
        <Probe kanji="車" />
      </Wrapper>
    );

    // No awaiting: expanded tiles render this during render.
    expect(screen.getByTestId("out").textContent).toBe("車/くるま");
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

describe("useKanjiRepresentativeWordDetails", () => {
  const Probe = ({ kanji }: { kanji: string }) => {
    const data = useKanjiRepresentativeWordDetails(kanji);
    if (data == null) return <span data-testid="out">none</span>;
    return (
      <span data-testid="out">{`${data.word}|${data.englishGloss}|${data.tags.join(",")}`}</span>
    );
  };

  it("shows the word immediately and fills in gloss and tag when they arrive", async () => {
    render(
      <Wrapper>
        <Probe kanji="車" />
      </Wrapper>
    );

    expect(screen.getByTestId("out").textContent).toBe("車||");

    await flush();

    expect(screen.getByTestId("out").textContent).toBe("車|car, vehicle|🚗");
    expect(request).toHaveBeenCalledWith({ type: "rep-word-details" });
  });

  it("stays null for a kanji with no representative word", async () => {
    render(
      <Wrapper>
        <Probe kanji="亜" />
      </Wrapper>
    );
    await flush();

    expect(screen.getByTestId("out").textContent).toBe("none");
  });
});
