import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchType } from "@/lib/settings/settings";
import { useSearchInputController } from "./use-search-input-controller";

// jsdom has no matchMedia; the controller probes it for autofocus.
vi.stubGlobal("matchMedia", () => ({ matches: false }));

const setup = (initialSearchType: SearchType) => {
  const onSettle = vi.fn();
  const hook = renderHook(() =>
    useSearchInputController({ initialSearchType, initialText: "", onSettle })
  );
  const type = (value: string, isComposing = false) =>
    act(() =>
      hook.result.current.inputHandlers.onChange({
        target: { value },
        nativeEvent: { isComposing },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    );
  return { hook, onSettle, type };
};

// Android keyboards can insert text with no paste / compositionend event.
describe("onChange search type inference", () => {
  it("switches to multi-kanji when a kanji is inserted", () => {
    const { hook, onSettle, type } = setup("meanings");
    type("漢字書");
    expect(hook.result.current.searchType).toBe("multi-kanji");
    expect(onSettle).toHaveBeenCalledWith("漢字書", "multi-kanji");
  });

  it.each(["similar", "multi-kanji"] as const)("keeps %s", (searchType) => {
    const { hook, type } = setup(searchType);
    type("漢字");
    expect(hook.result.current.searchType).toBe(searchType);
  });

  it("ignores romaji and kana while typing", () => {
    const { hook, type } = setup("keyword");
    type("water");
    type("みず");
    expect(hook.result.current.searchType).toBe("keyword");
  });

  it("does nothing mid-composition", () => {
    const { hook, type } = setup("meanings");
    type("漢", true);
    expect(hook.result.current.searchType).toBe("meanings");
  });
});
