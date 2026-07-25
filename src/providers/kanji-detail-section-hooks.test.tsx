import { act, render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import userEvent from "@testing-library/user-event";

import KANJI_WORKER_SINGLETON from "@/kanji-worker/kanji-worker-promise-wrapper";
import { IsReadyContext } from "@/kanji-worker/kanji-worker-hooks";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { clearWorkerDatasetCache } from "@/kanji-worker/worker-dataset-cache";
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
  // The memo is module-level and deliberately outlives components, so each
  // test needs a clean one.
  clearWorkerDatasetCache();
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

/**
 * The whole point of these two datasets living behind the accordion: opening a
 * kanji drawer must cost nothing, and the first expand must pay for every
 * kanji at once so later ones are free.
 *
 * The pieces are covered separately (SimpleAccordion.test.tsx proves a closed
 * body is unmounted; kanji-worker.test.ts proves the worker does not fetch the
 * file until the request arrives). This closes the chain in one place, because
 * the guarantee is what the user experiences, not any single link in it.
 */
describe("neither dataset is requested until its section is expanded", () => {
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
    request.mockResolvedValue({
      朝: { hlorenzi: null, kanjium: null, scott: ["龺", "月"], yagays: null },
      日: { hlorenzi: null, kanjium: null, scott: ["日"], yagays: null },
    });
  });

  it("requests nothing while the drawer is open but the section is collapsed", async () => {
    render(<Drawer kanji="朝" />);
    await flush();

    expect(request).not.toHaveBeenCalled();
  });

  it("requests once on the first expand", async () => {
    render(<Drawer kanji="朝" />);
    await flush();

    await userEvent.click(screen.getByText("Character Structure"));
    await flush();

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({ type: "structures-map" });
    expect(screen.getByText("龺月")).toBeVisible();
  });

  it("collapsing and re-expanding does not go back to the worker", async () => {
    render(<Drawer kanji="朝" />);
    await flush();

    const trigger = screen.getByText("Character Structure");
    await userEvent.click(trigger);
    await flush();
    await userEvent.click(trigger); // collapse — body unmounts
    await userEvent.click(trigger); // expand — body mounts fresh
    await flush();

    // Without the main-thread memo this would be 2: the worker would not
    // refetch the file, but it would still clone the whole map across the
    // boundary again on every expand.
    expect(request).toHaveBeenCalledTimes(1);
    expect(screen.getByText("龺月")).toBeVisible();
  });

  it("opening a different kanji's section reuses the same map", async () => {
    const first = render(<Drawer kanji="朝" />);
    await flush();
    await userEvent.click(screen.getByText("Character Structure"));
    await flush();
    expect(screen.getByText("龺月")).toBeVisible();

    first.unmount();

    render(<Drawer kanji="日" />);
    await flush();
    await userEvent.click(screen.getByText("Character Structure"));
    await flush();

    // One request total for both kanji: the whole map was already in hand.
    expect(request).toHaveBeenCalledTimes(1);
    expect(screen.getByText("日")).toBeVisible();
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
