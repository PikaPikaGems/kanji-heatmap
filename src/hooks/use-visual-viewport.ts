import { useEffect, useState } from "react";

export type VisualViewportRect = {
  /** Height of the area not covered by the on-screen keyboard, in px. */
  height: number;
  /** Offset of the visual viewport's top from the layout viewport, in px. */
  offsetTop: number;
};

/**
 * Tracks the visual viewport — the region left visible once the on-screen
 * keyboard opens.
 *
 * Chromium honours `interactive-widget=resizes-content` (set in index.html) and
 * shrinks the layout viewport for us, but iOS Safari ignores it: there the
 * layout viewport (and `100dvh`) stays full-screen while the keyboard overlays
 * the bottom. Sizing a container to this rect keeps inputs pinned above the
 * keyboard on every platform. Falls back to the full window when the API is
 * unavailable (older browsers, SSR).
 */
export function useVisualViewport(): VisualViewportRect {
  const [rect, setRect] = useState<VisualViewportRect>(() => ({
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    offsetTop: 0,
  }));

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () =>
      setRect({ height: vv.height, offsetTop: vv.offsetTop });

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return rect;
}
