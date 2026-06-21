import { SpeedKatakanaSettings } from "./types";

export const DEFAULT_SETTINGS: SpeedKatakanaSettings = {
  challengeSet: 1,
  randomizeFont: true,
  randomizeOrder: false,
  displayEnglish: true,
  wordCount: 48,
  sound: { enabled: true, type: "correct" },
};

export const SPEED_KATAKANA_TOTAL_SETS = 200;

export const SETTINGS_KEY = "speed-katakana-settings";
export const LEVELS = 10;
export const SETS_PER_LEVEL = SPEED_KATAKANA_TOTAL_SETS / LEVELS; // 25

export const levelOf = (challengeSet: number) =>
  Math.ceil(challengeSet / SETS_PER_LEVEL);

export const positionInLevel = (challengeSet: number) =>
  ((challengeSet - 1) % SETS_PER_LEVEL) + 1;

export const setFromLevelAndPos = (level: number, pos: number) =>
  (level - 1) * SETS_PER_LEVEL + pos;
