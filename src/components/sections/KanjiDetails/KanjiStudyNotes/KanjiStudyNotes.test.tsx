import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import KanjiStudyNotes from ".";
import { getKanjiStudyNotesStorageKey, MAX_STUDY_NOTE_LENGTH } from "./storage";

vi.mock("@/kanji-worker/kanji-worker-hooks", () => ({
  useWordKanjis: () => [{ kanji: "日", keyword: "day" }],
  useVocabDetails: (word: string) => ({
    status: "success",
    error: null,
    vocabInfo:
      word === "日本語"
        ? {
            meaning: "Japanese language",
            parts: [
              ["日", "に"],
              ["本", "ほん"],
              ["語", "ご"],
            ],
          }
        : null,
  }),
}));

vi.mock("@/providers/kanji-representative-word-provider", () => ({
  useKanjiRepresentativeWord: (kanji: string) =>
    kanji === "車"
      ? {
          word: "車",
          reading: "くるま",
          englishGloss: "car",
          tags: [],
        }
      : null,
}));

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.stubGlobal("speechSynthesis", {
    getVoices: () => [],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    cancel: vi.fn(),
    speak: vi.fn(),
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }))
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("KanjiStudyNotes", () => {
  it("limits and stores notes separately for each kanji", () => {
    const { rerender } = render(<KanjiStudyNotes kanji="日" />);
    const editor = screen.getByRole("textbox", {
      name: "Kanji study notes Markdown",
    });

    fireEvent.change(editor, {
      target: { value: "a".repeat(MAX_STUDY_NOTE_LENGTH + 1) },
    });

    expect(editor).toHaveValue("a".repeat(MAX_STUDY_NOTE_LENGTH));
    expect(
      JSON.parse(
        localStorage.getItem(getKanjiStudyNotesStorageKey("日")) ?? "{}"
      )
    ).toEqual({ notes: "a".repeat(MAX_STUDY_NOTE_LENGTH) });

    rerender(<KanjiStudyNotes kanji="月" />);
    expect(editor).toHaveValue("");
  });

  it("loads a saved note in preview and shows kana in the vocab popover", async () => {
    localStorage.setItem(
      getKanjiStudyNotesStorageKey("語"),
      JSON.stringify({ notes: "# Review 日本語" })
    );
    const user = userEvent.setup();

    render(<KanjiStudyNotes kanji="語" />);

    const vocabButton = screen.getByRole("button", { name: "日本語" });
    await user.click(vocabButton);

    await waitFor(() => {
      expect(screen.getByText(/にほんご/)).toBeInTheDocument();
      expect(screen.getByText(/Japanese language/)).toBeInTheDocument();
      expect(screen.getByText(/Explore this word further/)).toBeInTheDocument();
    });
  });

  it("uses directive kana and definition overrides in the popover", async () => {
    localStorage.setItem(
      getKanjiStudyNotesStorageKey("学"),
      JSON.stringify({
        notes: ':vocab[学ぶ]{kana="まなぶ" definition="to learn"}',
      })
    );
    const user = userEvent.setup();

    render(<KanjiStudyNotes kanji="学" />);

    await user.click(screen.getByRole("button", { name: "学ぶ" }));

    await waitFor(() => {
      expect(screen.getByText(/まなぶ/)).toBeInTheDocument();
      expect(screen.getByText(/to learn/)).toBeInTheDocument();
      expect(screen.getByText(/Explore this word further/)).toBeInTheDocument();
    });
  });

  it("renders pure kana as a romaji toggle instead of a vocab popover", () => {
    localStorage.setItem(
      getKanjiStudyNotesStorageKey("あ"),
      JSON.stringify({ notes: "にほんご" })
    );

    render(<KanjiStudyNotes kanji="あ" />);

    expect(
      screen.getByRole("button", {
        name: /Play reading and toggle kana or romaji for にほんご/,
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "にほんご" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Explore this word further/)
    ).not.toBeInTheDocument();
  });

  it("falls back to representative word details for a lone kanji", async () => {
    localStorage.setItem(
      getKanjiStudyNotesStorageKey("車"),
      JSON.stringify({ notes: "車" })
    );
    const user = userEvent.setup();

    render(<KanjiStudyNotes kanji="車" />);

    await user.click(screen.getByRole("button", { name: "車" }));

    await waitFor(() => {
      expect(screen.getByText(/くるま/)).toBeInTheDocument();
      expect(screen.getByText(/car/)).toBeInTheDocument();
    });
  });

  it("switches between preview and the highlighted editor", async () => {
    const user = userEvent.setup();
    render(<KanjiStudyNotes kanji="学" />);

    await user.type(
      screen.getByRole("textbox", { name: "Kanji study notes Markdown" }),
      "**学ぶ**"
    );
    await user.click(screen.getByRole("tab", { name: "View Mode" }));
    expect(screen.getByRole("button", { name: "学ぶ" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Edit Mode" }));
    expect(
      screen.getByRole("textbox", { name: "Kanji study notes Markdown" })
    ).toHaveValue("**学ぶ**");
  });

  it("opens edit mode when the empty preview is clicked", async () => {
    const user = userEvent.setup();
    render(<KanjiStudyNotes kanji="空" />);

    await user.click(screen.getByRole("tab", { name: "View Mode" }));
    await user.click(
      screen.getByRole("button", {
        name: /Your notes are empty\. Start writing to see them here\./,
      })
    );

    expect(
      screen.getByRole("textbox", { name: "Kanji study notes Markdown" })
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Edit Mode" })).toHaveAttribute(
      "data-state",
      "active"
    );
  });

  it("opens a fullscreen editor for coarse pointers", async () => {
    const user = userEvent.setup();
    const matchMedia = vi.mocked(window.matchMedia);
    matchMedia.mockImplementation((query) => ({
      matches: query === "(pointer: coarse)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }));

    try {
      render(<KanjiStudyNotes kanji="手" />);

      expect(
        screen.getByRole("button", { name: "Start writing" })
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Start writing" }));

      expect(
        screen.getByRole("heading", { name: /Study Notes/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: "Kanji study notes Markdown" })
      ).toBeInTheDocument();
    } finally {
      matchMedia.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      }));
    }
  });

  it("does not render raw HTML or javascript: links in preview", () => {
    localStorage.setItem(
      getKanjiStudyNotesStorageKey("安"),
      JSON.stringify({
        notes:
          'Safe <img src=x onerror="alert(1)"> and [click](javascript:alert(1)) then [ok](https://example.com)',
      })
    );

    const { container } = render(<KanjiStudyNotes kanji="安" />);

    expect(container.querySelector("img")).toBeNull();
    expect(
      screen.queryByRole("link", { name: "click" })
    ).not.toBeInTheDocument();
    expect(container).toHaveTextContent("click");

    const safeLink = screen.getByRole("link", { name: "ok" });
    expect(safeLink).toHaveAttribute("href", "https://example.com");
    expect(safeLink).toHaveAttribute("rel", "noreferrer noopener");
    expect(safeLink).toHaveAttribute("target", "_blank");
  });
});
