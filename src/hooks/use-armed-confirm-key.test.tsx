import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useArmedConfirmKey } from "./use-armed-confirm-key";

const dispatchKey = (
  type: "keydown" | "keyup",
  key: string,
  target: EventTarget = document.body
) => {
  target.dispatchEvent(
    new KeyboardEvent(type, { key, bubbles: true, cancelable: true })
  );
};

describe("useArmedConfirmKey", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("does not fire before the arm delay", () => {
    const onConfirm = vi.fn();
    renderHook(() => useArmedConfirmKey({ onConfirm }));

    dispatchKey("keydown", "Enter");

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("fires after the arm delay has passed", () => {
    const onConfirm = vi.fn();
    renderHook(() => useArmedConfirmKey({ onConfirm }));

    vi.advanceTimersByTime(300);
    dispatchKey("keydown", "Enter");

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("arms early when a confirm key is released", () => {
    const onConfirm = vi.fn();
    renderHook(() => useArmedConfirmKey({ onConfirm }));

    // The Enter that opened the UI is released → armed immediately.
    dispatchKey("keyup", "Enter");
    dispatchKey("keydown", "Enter");

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("supports multiple confirm keys", () => {
    const onConfirm = vi.fn();
    const keys = ["Enter", " "];
    renderHook(() => useArmedConfirmKey({ onConfirm, keys }));

    vi.advanceTimersByTime(300);
    dispatchKey("keydown", " ");
    dispatchKey("keydown", "Enter");

    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it("does nothing while disabled", () => {
    const onConfirm = vi.fn();
    renderHook(() => useArmedConfirmKey({ onConfirm, enabled: false }));

    vi.advanceTimersByTime(1000);
    dispatchKey("keydown", "Enter");

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("ignores keys pressed inside text fields", () => {
    const onConfirm = vi.fn();
    renderHook(() => useArmedConfirmKey({ onConfirm }));

    const input = document.createElement("input");
    document.body.appendChild(input);

    vi.advanceTimersByTime(300);
    dispatchKey("keydown", "Enter", input);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("re-arms when re-enabled", () => {
    const onConfirm = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useArmedConfirmKey({ onConfirm, enabled }),
      { initialProps: { enabled: true } }
    );

    vi.advanceTimersByTime(300);
    rerender({ enabled: false });
    rerender({ enabled: true });

    // Fresh subscription → not armed yet.
    dispatchKey("keydown", "Enter");
    expect(onConfirm).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    dispatchKey("keydown", "Enter");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
