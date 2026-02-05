import { useCallback, useLayoutEffect, useRef } from "react";

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

// rgbToHex(color)
export const useChangeThemeColor = () => {
  const colorIdRef = useRef(0);

  const setThemeColor = useCallback((colorIndex: number) => {
    document.documentElement.style.setProperty(
      "--theme-color-selected",
      themeColorsRgb[colorIndex]
    );
    localStorage.setItem(LOCAL_STORAGE_THEME_COLOR_KEY, colorIndex.toString());
  }, []);

  const nextThemeColor = useCallback(() => {
    colorIdRef.current = (colorIdRef.current + 1) % themeColorsRgb.length;
    setThemeColor(colorIdRef.current);
  }, [setThemeColor]);

  useLayoutEffect(() => {
    const themeColor = Number(
      localStorage.getItem(LOCAL_STORAGE_THEME_COLOR_KEY)
    );

    if (Number.isNaN(themeColor)) {
      setThemeColor(0);
      return;
    }

    setThemeColor(themeColor);
  }, [setThemeColor]);

  return nextThemeColor;
};
