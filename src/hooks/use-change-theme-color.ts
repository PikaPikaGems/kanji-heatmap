import { useCallback, useLayoutEffect } from "react";
import { notifyStorage } from "@/lib/storage";
import { useStorageValue } from "./use-storage-value";

const LOCAL_STORAGE_THEME_COLOR_KEY = "theme-color";

// Only store RGB values
export const themeColorsRgb = [
  "25, 60, 184", // blue (blue-700)
  "251, 2, 168", // pink (fuchsia-600)
  "170, 0, 255", // purple (purple-600)
  "0, 170, 255", // light blue (sky-500)
  "236, 0, 63", // red (rose-600)
  "0, 166, 62", // green (green-600)
  "234, 88, 12", // orange (orange-600)
  "234, 179, 8", // yellow (yellow-500)
  "20, 184, 166", // teal (teal-500)
  "168, 85, 247", // violet (violet-500)
  "236, 72, 153", // pink (pink-500)
  "6, 182, 212", // cyan (cyan-500)
  "132, 204, 22", // lime (lime-500)
  "251, 146, 60", // amber (amber-400)
  "244, 63, 94", // rose (rose-500)
  "59, 130, 246", // blue (blue-500)
  "14, 165, 233", // sky (sky-500)
  "99, 102, 241", // indigo (indigo-500)
];

const readThemeColorIndex = () => {
  const stored = Number(localStorage.getItem(LOCAL_STORAGE_THEME_COLOR_KEY));
  return Number.isNaN(stored) ? 0 : stored;
};

/** Applies + persists a theme color index without notifying other instances. */
const applyThemeColorStyle = (colorIndex: number) => {
  document.documentElement.style.setProperty(
    "--theme-color-selected",
    themeColorsRgb[colorIndex]
  );
  localStorage.setItem(LOCAL_STORAGE_THEME_COLOR_KEY, colorIndex.toString());
};

/**
 * Reactive current theme-color index + a direct setter. Stays in sync across
 * every hook instance (cycle button, settings grid) via the same
 * storage-event plumbing as useLocalStorageFlag.
 */
export const useCurrentThemeColor = () => {
  const colorIndex = useStorageValue(
    readThemeColorIndex,
    (key) => key === LOCAL_STORAGE_THEME_COLOR_KEY
  );

  const setThemeColor = useCallback((colorIndex: number) => {
    applyThemeColorStyle(colorIndex);
    notifyStorage(LOCAL_STORAGE_THEME_COLOR_KEY);
  }, []);

  // Layout effect needed: applies the persisted theme color to a CSS var on
  // the root element before paint (avoids a color flash).
  useLayoutEffect(() => {
    applyThemeColorStyle(readThemeColorIndex());
  }, []);

  return [colorIndex, setThemeColor] as [number, (colorIndex: number) => void];
};

export const useChangeThemeColor = () => {
  const [colorIndex, setThemeColor] = useCurrentThemeColor();

  return useCallback(() => {
    setThemeColor((colorIndex + 1) % themeColorsRgb.length);
  }, [colorIndex, setThemeColor]);
};
