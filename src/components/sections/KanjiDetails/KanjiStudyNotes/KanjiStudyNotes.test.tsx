import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import KanjiStudyNotes from ".";
import { getKanjiStudyNotesStorageKey, MAX_STUDY_NOTE_LENGTH } from "./storage";

vi.mock("@/kanji-worker/kanji-worker-hooks", () => ({
  useWordKanjis: () => [],
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

  it("loads a saved note in preview and opens Japanese vocab content", async () => {
    localStorage.setItem(
      getKanjiStudyNotesStorageKey("語"),
      JSON.stringify({ notes: "# Review 日本語" })
    );
    const user = userEvent.setup();

    render(<KanjiStudyNotes kanji="語" />);

    const vocabButton = screen.getByRole("button", { name: "日本語" });
    await user.click(vocabButton);

    await waitFor(() => {
      expect(screen.getByText(/Explore this word further/)).toBeInTheDocument();
    });
  });

  it("switches between preview and the highlighted editor", async () => {
    const user = userEvent.setup();
    render(<KanjiStudyNotes kanji="学" />);

    await user.type(
      screen.getByRole("textbox", { name: "Kanji study notes Markdown" }),
      "**学ぶ**"
    );
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByRole("button", { name: "学ぶ" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Edit" }));
    expect(
      screen.getByRole("textbox", { name: "Kanji study notes Markdown" })
    ).toHaveValue("**学ぶ**");
  });
});
