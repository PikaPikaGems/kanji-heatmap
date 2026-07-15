import { useEffect, useState } from "react";

/**
 * Pad edge length capped at `max`, shrunk to fit the viewport when needed.
 * Matches Stroke Order · Writing Practice (310px when the screen permits).
 */
export const useFitPadSize = (max: number, gutter = 48) => {
  const [size, setSize] = useState(() =>
    typeof window !== "undefined"
      ? Math.min(max, window.innerWidth - gutter)
      : max
  );

  useEffect(() => {
    const fit = () => setSize(Math.min(max, window.innerWidth - gutter));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [max, gutter]);

  return size;
};
