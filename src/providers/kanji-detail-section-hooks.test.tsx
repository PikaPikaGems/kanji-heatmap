import { act, render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import userEvent from "@testing-library/user-event";

import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import { IsReadyContext } from "@/kanji-worker/kanji-worker-hooks";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { useKanjiReadingDetails } from "./kanji-reading-category-hooks";
import { useMultiKanjiStructure } from "./multiple-kanji-structure-hooks";

/**
 * Both hooks replaced main-thread fetch-all providers with a per-kanji worker
 * request. The sections that consume them predate the worker's status
 * vocabulary, so these tests pin the status strings as well as the data.
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

const 朝Structure = {
  hlorenzi: { type: "kaii" as const },
  kanjium: null,
  scott: ["龺", "月"],
  yagays: null,
};

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

  it("asks the worker for the one kanji it is rendering", async () => {
    request.mockResolvedValue(朝Structure);

    render(
      <Wrapper>
        <Probe kanji="朝" />
      </Wrapper>
    );
    await flush();

    // Not the whole map: the worker keeps that and answers per kanji, so the
    // main thread never holds a second copy of it.
    expect(request).toHaveBeenCalledWith({
      type: "kanji-structure",
      payload: "朝",
    });
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
    request.mockResolvedValue(null);

    render(
      <Wrapper>
        <Probe kanji="一" />
      </Wrapper>
    );
    await flush();

    expect(screen.getByTestId("scott").textContent).toBe("none");
  });

  it("re-requests when the drawer moves to another kanji", async () => {
    request.mockResolvedValue(朝Structure);

    const view = render(
      <Wrapper>
        <Probe kanji="朝" />
      </Wrapper>
    );
    await flush();

    view.rerender(
      <Wrapper>
        <Probe kanji="日" />
      </Wrapper>
    );
    await flush();

    // Arrow-keying through the list must show the new kanji's structure, not
    // the previous one's.
    expect(request).toHaveBeenLastCalledWith({
      type: "kanji-structure",
      payload: "日",
    });
  });

  it("does not request anything before the worker is ready", async () => {
    request.mockResolvedValue(朝Structure);

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

/**
 * The guarantee that matters to the user: opening a kanji drawer costs nothing
 * until a section is actually expanded.
 *
 * The links are covered separately — SimpleAccordion.test.tsx proves a closed
 * body is unmounted, kanji-worker.test.ts proves the worker does not fetch the
 * JSON until a request arrives — but the guarantee is the whole chain, so it is
 * asserted here as one thing.
 */
describe("nothing is requested until the section is expanded", () => {
  const Section = ({ kanji }: { kanji: string }) => {
    const { kanjiStructureData } = useMultiKanjiStructure(kanji);
    return <span>{kanjiStructureData?.scott?.join("") ?? "no data"}</span>;
  };

  const Drawer = ({ kanji }: { kanji: string }) => (
    <Wrapper>
      <SimpleAccordion trigger="Character Structure">
        <Section kanji={kanji} />
      </SimpleAccordion>
    </Wrapper>
  );

  beforeEach(() => {
    request.mockResolvedValue(朝Structure);
  });

  it("requests nothing while the drawer is open but the section is collapsed", async () => {
    render(<Drawer kanji="朝" />);
    await flush();

    expect(request).not.toHaveBeenCalled();
  });

  it("requests exactly one kanji on the first expand", async () => {
    render(<Drawer kanji="朝" />);
    await flush();

    await userEvent.click(screen.getByText("Character Structure"));
    await flush();

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      type: "kanji-structure",
      payload: "朝",
    });
    expect(screen.getByText("龺月")).toBeVisible();
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
    request.mockResolvedValue([
      { reading: "チョウ", type: "ON", frequency: "↔", example_word: "朝食" },
      { reading: "あさ", type: "KUN", frequency: "↑", example_word: "朝" },
    ]);

    render(
      <Wrapper>
        <Probe kanji="朝" />
      </Wrapper>
    );
    await flush();

    expect(request).toHaveBeenCalledWith({
      type: "kanji-reading-details",
      payload: "朝",
    });
    expect(screen.getByTestId("readings").textContent).toBe("チョウ,あさ");
  });

  it("shows no data when the worker answers null", async () => {
    // 292 of 2,426 kanji have no reading breakdown. The worker collapses both
    // "absent" and "empty list" to null so the section has one no-info path.
    request.mockResolvedValue(null);

    render(
      <Wrapper>
        <Probe kanji="朝" />
      </Wrapper>
    );
    await flush();

    expect(screen.getByTestId("readings").textContent).toBe("none");
  });
});
