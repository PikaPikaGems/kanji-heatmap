import * as wanakana from "wanakana";

export type TranslateType =
  | "romaji"
  | "hiragana"
  | "katakana"
  | "kana"
  | "none";

export function translateValue(val: string, type: TranslateType) {
  // Need IMEMode option to handle single kana characters like ん and い
  if (type === "hiragana") {
    return wanakana.toHiragana(val, { IMEMode: true });
  }

  if (type === "katakana") {
    return wanakana.toKatakana(val, { IMEMode: true });
  }

  if (type === "romaji") {
    return wanakana.toRomaji(val);
  }

  if (type === "kana") {
    return wanakana.toKana(val, { IMEMode: true });
  }

  return val;
}

export const tryConvertRomaji = (kana: string) => {
  try {
    return wanakana.toRomaji(kana);
  } catch {
    return kana;
  }
};

export const hasKanji = (text: string) => {
  return (
    text.split("").findIndex((character) => {
      return (
        wanakana.isHiragana(character) === false &&
        wanakana.isKatakana(character) === false &&
        wanakana.isRomaji(character) === false &&
        wanakana.isJapanese(character)
      );
    }) !== -1
  );
};

const wanakanaAdapter = {
  toKatakana: wanakana.toKatakana,
  toRomaji: wanakana.toRomaji,
  toHiragana: wanakana.toHiragana,
  toKana: wanakana.toKana,
  isJapanese: wanakana.isJapanese,
  isKatakana: wanakana.isKatakana,
  isHiragana: wanakana.isHiragana,
  isRomaji: wanakana.isRomaji,
  isKana: wanakana.isKana,
};

export default wanakanaAdapter;
