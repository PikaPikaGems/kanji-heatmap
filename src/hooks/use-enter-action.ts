import { useEffect } from "react";

/**
 * Fire `action` on the given keys when focus isn't in a text field / select.
 * Skips while IME is composing. Default key is Enter; pass `["Enter", " "]`
 * to also accept Space. `action` gets the key, for callers that map several.
 */
export const useEnterAction = (
  action: ((key: string) => void) | null,
  enabled = true,
  keys: readonly string[] = ["Enter"]
) => {
  // Effect needed: subscribes to window keydown and must unsubscribe on
  // unmount/disable.
  useEffect(() => {
    if (!enabled || !action) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // defaultPrevented: another layer took the key (a drawer or dialog
      // dismissing on Escape) before it reached the window.
      if (!keys.includes(e.key) || e.isComposing || e.defaultPrevented) return;
      // Ctrl / Cmd / Alt + letter is a browser shortcut (find, history), not ours.
      if (e.key.length === 1 && (e.ctrlKey || e.metaKey || e.altKey)) return;
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (el.isContentEditable) return;
      if (el.closest('[role="listbox"], [role="combobox"], [role="menu"]')) {
        return;
      }
      e.preventDefault();
      action(e.key);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [action, enabled, keys]);
};
