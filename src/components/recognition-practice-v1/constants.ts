import { JLPT_TYPE_ARR, JLTPTtypes } from "@/lib/jlpt";
import { RecognitionPracticeSettings } from "./types";

export const SESSION_SIZE = 10;
export const SETTINGS_KEY = "recognition-practice-v1-settings";

export const DEFAULT_SETTINGS: RecognitionPracticeSettings = {
  jlpt: [...JLPT_TYPE_ARR] as JLTPTtypes[],
  bookmarkedOnly: false,
  randomizeOrder: true,
  randomizeFont: false,
  sound: { enabled: true, type: "correct" },
};
