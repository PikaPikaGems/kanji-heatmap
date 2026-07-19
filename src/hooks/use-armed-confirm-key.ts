import { useEffect, useRef } from "react";

/**
 * Confirm-key listener that "arms" itself before firing, so the key press
 * that opened the current UI (e.g. Enter submitting the previous step)
 * doesn't immediately confirm it too. Arms after `armDelayMs`, or as soon as
 * a confirm key is released. Ignores IME composition and key presses from
 * text fields.
 */
export const useArmedConfirmKey = ({
  onConfirm,
  enabled = true,
  keys = ["Enter"],
  armDelayMs = 300,
}: {
  onConfirm: () => void;
  enabled?: boolean;
  /** Pass a module-level constant to avoid re-subscribing every render. */
  keys?: readonly string[];
  armDelayMs?: number;
}) => {
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  useEffect(() => {
    if (!enabled) return;

    let armed = false;
    const arm = () => {
      armed = true;
    };
    const armTimeout = window.setTimeout(arm, armDelayMs);
    const onKeyUp = (e: KeyboardEvent) => {
      if (keys.includes(e.key)) arm();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!armed || !keys.includes(e.key) || e.isComposing) return;
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (el.isContentEditable) return;
      e.preventDefault();
      onConfirmRef.current();
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(armTimeout);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, keys, armDelayMs]);
};
