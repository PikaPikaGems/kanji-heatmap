import { JLPT_TYPE_ARR, JLTPTtypes } from "@/lib/jlpt";
import { ProductionPracticeSettings } from "./types";

export const SESSION_SIZE = 10;
/** Look-alike grid size: always 4×3. */
export const CANDIDATE_COUNT = 12;
export const SETTINGS_KEY = "production-practice-v1-settings";

export const DEFAULT_SETTINGS: ProductionPracticeSettings = {
  jlpt: [...JLPT_TYPE_ARR] as JLTPTtypes[],
  bookmarkedOnly: false,
  randomizeOrder: true,
  randomizeFont: false,
  blurEnglishGloss: true,
  hearPronunciationOnLoad: false,
  celebratorySoundOnCorrect: true,
};

/** Same as Stroke Order · Writing Practice; shrink via useFitPadSize on narrow screens. */
export { SVG_SIZE as DRAW_SVG_SIZE } from "@/components/sections/KanjiDetails/stroke-animation-constants";
