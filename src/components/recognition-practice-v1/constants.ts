import {
  DEFAULT_DECK_FILTER_SETTINGS,
  PRACTICE_SESSION_SIZE,
} from "@/components/shared-practice/constants";
import { RecognitionPracticeSettings } from "./types";

export const SESSION_SIZE = PRACTICE_SESSION_SIZE;
export const SETTINGS_KEY = "recognition-practice-v1-settings";

export const DEFAULT_SETTINGS: RecognitionPracticeSettings = {
  ...DEFAULT_DECK_FILTER_SETTINGS,
  sound: { enabled: true, type: "correct" },
};
