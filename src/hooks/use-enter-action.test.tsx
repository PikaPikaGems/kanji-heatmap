import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEnterAction } from "./use-enter-action";

const pressKey = (
  key: string,
  target: HTMLElement = document.body,
  init: KeyboardEventInit = {}
) => {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
};

describe("useEnterAction", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("fires the action on Enter and prevents default", () => {
    const action = vi.fn();
    renderHook(() => useEnterAction(action));

    const event = pressKey("Enter");

    expect(action).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("ignores other keys by default", () => {
    const action = vi.fn();
    renderHook(() => useEnterAction(action));

    pressKey(" ");
    pressKey("a");

    expect(action).not.toHaveBeenCalled();
  });

  it("supports custom keys (Enter or Space)", () => {
    const action = vi.fn();
    renderHook(() => useEnterAction(action, true, ["Enter", " "]));

    pressKey(" ");
    pressKey("Enter");

    expect(action).toHaveBeenCalledTimes(2);
  });

  it("does nothing when disabled or action is null", () => {
    const action = vi.fn();
    renderHook(() => useEnterAction(action, false));
    renderHook(() => useEnterAction(null));

    pressKey("Enter");

    expect(action).not.toHaveBeenCalled();
  });

  it("ignores key presses while an input field has focus", () => {
    const action = vi.fn();
    renderHook(() => useEnterAction(action));

    for (const tag of ["input", "textarea", "select"] as const) {
      const el = document.createElement(tag);
      document.body.appendChild(el);
      pressKey("Enter", el);
    }

    expect(action).not.toHaveBeenCalled();
  });

  it("ignores key presses from inside listbox/combobox/menu widgets", () => {
    const action = vi.fn();
    renderHook(() => useEnterAction(action));

    const listbox = document.createElement("div");
    listbox.setAttribute("role", "listbox");
    const option = document.createElement("div");
    listbox.appendChild(option);
    document.body.appendChild(listbox);

    pressKey("Enter", option);

    expect(action).not.toHaveBeenCalled();
  });

  it("ignores key presses while IME composition is active", () => {
    const action = vi.fn();
    renderHook(() => useEnterAction(action));

    pressKey("Enter", document.body, { isComposing: true });

    expect(action).not.toHaveBeenCalled();
  });

  it("stops firing after unmount", () => {
    const action = vi.fn();
    const { unmount } = renderHook(() => useEnterAction(action));

    unmount();
    pressKey("Enter");

    expect(action).not.toHaveBeenCalled();
  });
});
