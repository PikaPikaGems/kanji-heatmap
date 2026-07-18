import {
  DEFAULT_DECK_FILTER_SETTINGS,
  PRACTICE_SESSION_SIZE,
} from "@/components/shared-practice/constants";
import { ProductionPracticeSettings } from "./types";

export const SESSION_SIZE = PRACTICE_SESSION_SIZE;
/** Look-alike grid size: always 4×3. */
export const CANDIDATE_COUNT = 12;
/** Ranks that count as “in top 10” for session scoring. */
export const GRADE_TOP_K = 10;
/**
 * Extra DaKanji guesses for the grid. After dropping kana/radicals we still
 * need enough real kanji to pad to CANDIDATE_COUNT (especially on small decks).
 */
export const RECOGNIZE_TOP_K = 40;
export const SETTINGS_KEY = "production-practice-v1-settings";

export const DEFAULT_SETTINGS: ProductionPracticeSettings = {
  ...DEFAULT_DECK_FILTER_SETTINGS,
  blurEnglishGloss: true,
  hearPronunciationOnLoad: false,
  celebratorySoundOnCorrect: true,
};

/** Same as Stroke Order · Writing Practice; shrink via useFitPadSize on narrow screens. */
export { SVG_SIZE as DRAW_SVG_SIZE } from "@/components/sections/KanjiDetails/stroke-animation-constants";
