import { useCallback, useLayoutEffect } from "react";
import { notifyStorage } from "@/lib/storage";
import { useStorageValue } from "./use-storage-value";

const LOCAL_STORAGE_THEME_COLOR_KEY = "theme-color";

// Only store RGB values — one saturated swatch per hue family (24 = 4×6 grid)
export const themeColorsRgb = [
  "25, 60, 184", // blue-700 (default)
  "99, 102, 241", // indigo-500
  "168, 85, 247", // violet-500
  "147, 51, 234", // purple-600
  "251, 2, 168", // fuchsia-600
  "236, 72, 153", // pink-500
  "225, 29, 72", // rose-600
  "220, 38, 38", // red-600
  "234, 88, 12", // orange-600
  "245, 158, 11", // amber-500
  "234, 179, 8", // yellow-500
  "132, 204, 22", // lime-500
  "22, 163, 74", // green-600
  "16, 185, 129", // emerald-500
  "20, 184, 166", // teal-500
  "6, 182, 212", // cyan-500
  "14, 165, 233", // sky-500
  "59, 130, 246", // blue-500
  "124, 58, 237", // violet-600
  "219, 39, 119", // pink-700
  "251, 146, 60", // amber-400
  "125, 211, 252", // sky-300
  "100, 116, 139", // slate-500
  "154, 52, 18", // orange-800
];

const readThemeColorIndex = () => {
  const stored = Number(localStorage.getItem(LOCAL_STORAGE_THEME_COLOR_KEY));
  if (Number.isNaN(stored)) return 0;
  return Math.min(Math.max(stored, 0), themeColorsRgb.length - 1);
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
