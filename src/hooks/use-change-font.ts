import { useCallback, useLayoutEffect } from "react";
import { notifyStorage } from "@/lib/storage";
import { useStorageValue } from "./use-storage-value";

const LOCAL_STORAGE_KANJI_FONT_KEY = "kanji-font";
export const NUMBER_OF_FONTS = 15;

/** A random valid kanji-font index. */
export const randomFontIndex = () =>
  Math.floor(Math.random() * NUMBER_OF_FONTS);

const readFontIndex = () => {
  const stored = Number(localStorage.getItem(LOCAL_STORAGE_KANJI_FONT_KEY));
  return Number.isNaN(stored) ? 0 : stored;
};

/** Applies + persists a font index without notifying other instances. */
const applyFontStyle = (fontNum: number) => {
  document.documentElement.style.setProperty(
    "--kanji-font",
    `var(--jap-font-${fontNum})`
  );
  localStorage.setItem(LOCAL_STORAGE_KANJI_FONT_KEY, fontNum.toString());
};

/**
 * Reactive current font index + a direct setter. Stays in sync across every
 * hook instance (cycle buttons, settings grid) via the same storage-event
 * plumbing as useLocalStorageFlag.
 */
export const useCurrentFont = () => {
  const fontIndex = useStorageValue(
    readFontIndex,
    (key) => key === LOCAL_STORAGE_KANJI_FONT_KEY
  );

  const setFont = useCallback((fontNum: number) => {
    applyFontStyle(fontNum);
    notifyStorage(LOCAL_STORAGE_KANJI_FONT_KEY);
  }, []);

  // Layout effect needed: applies the persisted kanji font to a CSS var on
  // the root element before paint (avoids a font flash).
  useLayoutEffect(() => {
    applyFontStyle(readFontIndex());
  }, []);

  return [fontIndex, setFont] as [number, (fontNum: number) => void];
};

export const useChangeFont = () => {
  const [fontIndex, setFont] = useCurrentFont();

  return useCallback(() => {
    setFont((fontIndex + 1) % NUMBER_OF_FONTS);
  }, [fontIndex, setFont]);
};
