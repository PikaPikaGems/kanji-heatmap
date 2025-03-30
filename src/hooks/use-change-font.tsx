import { useCallback, useLayoutEffect, useRef } from "react";

const LOCAL_STORAGE_KANJI_FONT_KEY = "kanji-font";
const NUMBER_OF_FONTS = 7;

export const useChangeFont = () => {
  const fontIdRef = useRef(0);

  const setFont = useCallback((fontNum: number) => {
    document.documentElement.style.setProperty(
      "--kanji-font",
      `var(--jap-font-${fontNum})`
    );
    localStorage.setItem(LOCAL_STORAGE_KANJI_FONT_KEY, fontNum.toString());
  }, []);

  const nextFont = useCallback(() => {
    fontIdRef.current = (fontIdRef.current + 1) % NUMBER_OF_FONTS;
    setFont(fontIdRef.current);
  }, [setFont]);

  useLayoutEffect(() => {
    const kanjiFont = Number(
      localStorage.getItem(LOCAL_STORAGE_KANJI_FONT_KEY)
    );

    if (Number.isNaN(kanjiFont)) {
      setFont(0);
      return;
    }

    setFont(kanjiFont);
  }, [setFont]);

  return nextFont;
};
