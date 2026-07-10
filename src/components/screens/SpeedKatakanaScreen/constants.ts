import { SpeedKatakanaSettings } from "./types";

export const DEFAULT_SETTINGS: SpeedKatakanaSettings = {
  challengeSet: 1,
  randomizeFont: true,
  randomizeOrder: false,
  displayEnglish: true,
  wordCount: 48,
  sound: { enabled: true, type: "correct" },
};

export const SPEED_KATAKANA_TOTAL_CHALLENGES = 200;

export const SETTINGS_KEY = "speed-katakana-settings";
export const LEVELS = 20;
export const CHALLENGES_PER_LEVEL = SPEED_KATAKANA_TOTAL_CHALLENGES / LEVELS; // 200 / 20 = 10

export const levelOf = (challengeSet: number) =>
  Math.ceil(challengeSet / CHALLENGES_PER_LEVEL);

export const positionInLevel = (challengeSet: number) =>
  ((challengeSet - 1) % CHALLENGES_PER_LEVEL) + 1;

export const setFromLevelAndPos = (level: number, pos: number) =>
  (level - 1) * CHALLENGES_PER_LEVEL + pos;
