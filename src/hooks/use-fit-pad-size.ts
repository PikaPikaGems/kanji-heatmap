import { useWindowSize } from "./use-window-size";

/**
 * Pad edge length capped at `max`, shrunk to fit the viewport when needed.
 * Matches Stroke Order · Writing Practice (310px when the screen permits).
 * Derived during render from the shared window-size hook (no own listener).
 */
export const useFitPadSize = (max: number, gutter = 48) => {
  const [windowWidth] = useWindowSize(0);
  return windowWidth > 0 ? Math.min(max, windowWidth - gutter) : max;
};
