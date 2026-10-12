import sizes from "./download-sizes.json";
import { FillTheKanjiSetId } from "./fill-the-kanji/sets";

/**
 * Sizes of the offline downloads offered in the settings, from the generated
 * download-sizes.json: uncompressed bytes, plus how many items each holds.
 */
export const KANJI_SVG_SIZES = sizes.kanjiSvgs;
export const KATAKANA_SIZES = sizes.katakana;

const FILL_THE_KANJI_BYTES = sizes.fillTheKanji as Record<string, number>;

export const fillTheKanjiSetBytes = (setId: FillTheKanjiSetId): number =>
  FILL_THE_KANJI_BYTES[setId] ?? 0;
